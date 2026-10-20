import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import { isPlatformAdmin, isMarketplaceSeller } from '../utils/accountRoles.js';
import { publicSellerStore } from '../utils/sellerStore.js';

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export function adminSellerListingService({ users = User, products = Product, orders = Order, audits = AuditLog,
  storeFor = publicSellerStore, startSession = () => mongoose.startSession(),
} = {}) {
  const targetSeller = async (actor, sellerId) => {
    if (!isPlatformAdmin(actor)) fail('Only a platform administrator can select a listing seller.', 403);
    if (!/^[a-f0-9]{24}$/i.test(String(sellerId || ''))) fail('Choose a valid seller.');
    const user = await users.findById(sellerId);
    if (!user || !isMarketplaceSeller(user) || user.sellerAccessStatus !== 'active') fail('Choose an active marketplace seller.');
    const store = await storeFor(sellerId);
    if (!store) fail('This seller must complete the existing verification checks before receiving listings.');
    return store;
  };
  const audit = (actor, product, oldSellerId, store, reason) => ({
    actorId: actor._id, actorEmail: actor.email, action: oldSellerId ? 'product.seller_assigned' : 'product.created_for_seller',
    entityType: 'product', entityId: String(product._id), summary: `Administrator assigned ${product.name} to ${store.name}`,
    metadata: { previousSellerId: String(oldSellerId || ''), sellerId: store.id, storeName: store.name, reason, status: product.status },
  });
  return {
    targetSeller,
    list: async (req, res) => {
      try {
        if (!isPlatformAdmin(req.user)) fail('Platform administrator access required.', 403);
        res.set('Cache-Control', 'no-store');
        const usersFound = await users.find({ sellerAccessStatus: 'active', $or: [{ accountType: 'seller' }, { sellerRole: 'member' }] }).select('_id').lean();
        const stores = await Promise.all(usersFound.map(user => storeFor(user._id)));
        return res.json({ sellers: stores.filter(Boolean).map(store => ({ id: store.id, name: store.name, deliveryStates: store.deliveryStates || [] })) });
      } catch (error) { return res.status(error.status || 500).json({ message: error.status ? error.message : 'Seller choices could not be loaded.' }); }
    },
    saveCreated: async (actor, product, store) => {
      const session = await startSession();
      let created;
      try {
        await session.withTransaction(async () => {
          // Use a fresh model insert on transaction retries; do not reuse a document's mutated isNew state.
          [created] = await products.create([product.toObject()], { session });
          await audits.create([audit(actor, product, null, store, 'Administrator created listing for seller')], { session });
        });
        return created;
      } finally { await session.endSession(); }
    },
    assignDraft: async (req, res) => {
      let session;
      try {
        const store = await targetSeller(req.user, req.body.sellerId);
        const reason = String(req.body.reason || '').trim();
        if (reason.length < 5 || reason.length > 500) fail('Enter a reason for the seller assignment (5–500 characters).');
        if (!/^[a-f0-9]{24}$/i.test(req.params.id)) fail('Invalid product.');
        session = await startSession();
        let assigned;
        await session.withTransaction(async () => {
          const product = await products.findById(req.params.id).session(session);
          if (!product) fail('Product not found.', 404);
          if (product.status !== 'draft') fail('Only private drafts can change seller. Published listings keep their existing ownership.', 409);
          if (String(product.sellerId || '') === store.id) fail('This draft already belongs to the selected seller.');
          if (product.reviews?.length || await orders.exists({ $or: [
            { 'products._id': { $in: [product._id, String(product._id)] } },
            { 'products.productId': { $in: [product._id, String(product._id)] } },
          ] }).session(session)) fail('A listing with order or review history cannot change seller.', 409);
          const oldSellerId = product.sellerId;
          product.sellerId = store.id;
          product.approvalStatus = 'pending';
          product.approvalNote = '';
          product.reviewedAt = null;
          product.reviewedBy = null;
          // Eligibility was checked using the same verification/enrolment policy as the storefront.
          product.sellerComplianceHold = false;
          await product.save({ session });
          await audits.create([audit(req.user, product, oldSellerId, store, reason)], { session });
          assigned = { id: String(product._id), sellerId: store.id, storeName: store.name, status: 'draft', approvalStatus: 'pending' };
        });
        return res.json({ message: `Draft assigned to ${store.name}. Administrator approval is required before it goes live.`, product: assigned });
      } catch (error) { return res.status(error.status || 500).json({ message: error.status ? error.message : 'Seller assignment could not be saved. No ownership change was committed.' }); }
      finally { if (session) await session.endSession(); }
    },
  };
}
