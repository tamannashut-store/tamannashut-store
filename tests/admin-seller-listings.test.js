import test from 'node:test';
import assert from 'node:assert/strict';
import { adminSellerListingService } from '../server/src/services/adminSellerListingService.js';

const admin = { _id: '111111111111111111111111', accountType: 'platform_admin', email: 'owner@example.com' };
const seller = { _id: '222222222222222222222222', accountType: 'seller', sellerAccessStatus: 'active' };
const id = '333333333333333333333333';
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, set() {}, json(body) { this.body = body; return this; } });
function fixture() {
  const product = { _id: id, sellerId: admin._id, name: 'Prepared draft', status: 'draft', approvalStatus: 'not_required',
    images: [{ url: 'unchanged' }], variants: [{ sku: 'KC-1', price: 499, stock: 7 }], reviews: [] };
  const state = { products: [product], audits: [], orders: false, auditFails: false, store: true };
  const store = { id: seller._id, name: 'Kismat Collection', deliveryStates: ['West Bengal'] };
  const session = { async withTransaction(fn) {
    const before = structuredClone({ products: state.products, audits: state.audits });
    try { await fn(); } catch (e) { state.products = before.products; state.audits = before.audits; throw e; }
  }, async endSession() {} };
  const service = adminSellerListingService({ users: { findById: async value => value === seller._id ? seller : null,
    find: () => ({ select() { return this; }, lean: async () => [seller] }) },
    products: { create: async docs => { state.products.push(...structuredClone(docs)); return docs; }, findById: value => ({ session: async () => {
      const found = state.products.find(p => p._id === value);
      if (!found) return null;
      const document = structuredClone(found);
      document.save = async () => { const { save: _save, ...fields } = document; state.products = state.products.map(p => p._id === value ? structuredClone(fields) : p); };
      return document;
    } }) },
    orders: { exists: () => ({ session: async () => state.orders }) },
    audits: { create: async docs => { if (state.auditFails) throw new Error('Audit database failure'); state.audits.push(...docs); } },
    storeFor: async () => state.store ? store : null, startSession: async () => session,
  });
  const assign = async (actor = admin, body = {}) => {
    const res = response(); await service.assignDraft({ user: actor, params: { id }, body: { sellerId: seller._id, reason: 'Correct admin-created seller draft', ...body } }, res); return res;
  };
  return { state, service, assign };
}
test('admin corrects private draft ownership and durable audit records actual actor and both owners', async () => {
  const f = fixture(), before = structuredClone(f.state.products[0]); const res = await f.assign();
  assert.equal(res.statusCode, 200); const after = f.state.products[0];
  assert.equal(after.sellerId, seller._id); assert.equal(after.status, 'draft'); assert.equal(after.approvalStatus, 'pending');
  assert.deepEqual(after.variants, before.variants); assert.deepEqual(after.images, before.images);
  assert.equal(f.state.audits.length, 1); const audit = f.state.audits[0];
  assert.equal(audit.actorId, admin._id); assert.equal(audit.metadata.previousSellerId, admin._id); assert.equal(audit.metadata.sellerId, seller._id);
});
test('seller cannot forge ownership assignment or create on behalf of another seller', async () => {
  const f = fixture(); assert.equal((await f.assign(seller)).statusCode, 403);
  await assert.rejects(f.service.targetSeller(seller, seller._id), e => e.status === 403);
  assert.equal(f.state.products[0].sellerId, admin._id); assert.equal(f.state.audits.length, 0);
});
test('active, archived, previously ordered and reviewed products cannot change ownership', async () => {
  for (const status of ['active', 'archived']) { const f = fixture(); f.state.products[0].status = status; assert.equal((await f.assign()).statusCode, 409); }
  const f = fixture(); f.state.orders = true; assert.equal((await f.assign()).statusCode, 409);
  const g = fixture(); g.state.products[0].reviews = [{ rating: 5 }]; assert.equal((await g.assign()).statusCode, 409);
});
test('unknown, malformed or unverified target sellers and missing reasons are rejected', async () => {
  const f = fixture(); assert.equal((await f.assign(admin, { sellerId: 'bad-id' })).statusCode, 400);
  assert.equal((await f.assign(admin, { sellerId: '999999999999999999999999' })).statusCode, 400);
  assert.equal((await f.assign(admin, { reason: '' })).statusCode, 400);
  f.state.store = false; assert.equal((await f.assign()).statusCode, 400);
  assert.equal(f.state.products[0].sellerId, admin._id);
});
test('audit storage failure rolls ownership update back', async () => {
  const f = fixture(); f.state.auditFails = true;
  assert.equal((await f.assign()).statusCode, 500); assert.equal(f.state.products[0].sellerId, admin._id); assert.equal(f.state.audits.length, 0);
});
test('admin-created seller listing and audit are committed together or both rolled back', async () => {
  for (const auditFails of [false, true]) {
    const f = fixture(); f.state.auditFails = auditFails;
    const product = { _id: '444444444444444444444444', sellerId: seller._id, status: 'draft', name: 'New seller listing' };
    const store = await f.service.targetSeller(admin, seller._id);
    const save = f.service.saveCreated(admin, { ...product, toObject: () => product }, store);
    if (auditFails) await assert.rejects(save); else await save;
    assert.equal(f.state.products.length, auditFails ? 1 : 2); assert.equal(f.state.audits.length, auditFails ? 0 : 1);
  }
});
test('seller choices expose storefront identity and delivery limits, not personal or bank data', async () => {
  const f = fixture(), res = response(); await f.service.list({ user: admin }, res);
  assert.deepEqual(res.body, { sellers: [{ id: seller._id, name: 'Kismat Collection', deliveryStates: ['West Bengal'] }] });
});
