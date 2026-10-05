import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RefundDestination from "../models/RefundDestination.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { needsRefundDetails, normalizeRefundDestination, maskRefundDestination, encryptRefundDestination, decryptRefundDestination } from "../utils/refundDestination.js";
import { notifyRefundDetails } from "../services/refundDetailsNotification.js";
import { recordAudit } from "../utils/recordAudit.js";

const router = express.Router();
router.use(protect);
router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
const validId = (id) => mongoose.isObjectIdOrHexString(id);
const fail = (res, error) => res.status(error.status || 500).json({ message: error.status ? error.message : "Refund details could not be processed. Please try again." });

export const refundDetailsHandlers = ({ orders = Order, destinations = RefundDestination, audit = recordAudit } = {}) => ({
  get: async (req, res) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
      const order = await orders.findOne({ _id: req.params.id, userId: req.user._id });
      if (!order) return res.status(404).json({ message: "Order not found" });
      const details = await destinations.findOne({ orderId: order._id, userId: req.user._id });
      return res.json({ required: needsRefundDetails(order), submitted: Boolean(details), method: details?.method || "", maskedDestination: details?.maskedDestination || "", submittedAt: details?.updatedAt || null });
    } catch (error) { return fail(res, error); }
  },
  submit: async (req, res) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
      const order = await orders.findOne({ _id: req.params.id, userId: req.user._id });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (!needsRefundDetails(order)) return res.status(409).json({ message: "Refund details can be provided only for a collected COD order awaiting refund" });
      const details = normalizeRefundDestination(req.body);
      const encryptedDetails = encryptRefundDestination(details);
      const saved = await destinations.findOneAndUpdate({ orderId: order._id, userId: req.user._id }, { $set: { method: details.method, maskedDestination: maskRefundDestination(details), encryptedDetails } }, { upsert: true, new: true, runValidators: true });
      await orders.updateOne({ _id: order._id, status: "Refund Pending" }, { $set: { "refund.detailsSubmittedAt": new Date() } });
      await audit({ user: req.user, action: "order.refund_details_submitted", entityType: "order", entityId: order._id, summary: "Customer submitted refund destination", metadata: { method: details.method } });
      return res.json({ message: "Refund details saved. We will notify you when payment is completed.", submitted: true, method: saved.method, maskedDestination: saved.maskedDestination, submittedAt: saved.updatedAt });
    } catch (error) { return fail(res, error); }
  },
});
const handlers = refundDetailsHandlers();

router.get("/notifications", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: "Refund Pending", paymentMethod: "COD", paymentStatus: "Paid" }).select("_id refund.detailsRequestedAt").lean();
    const submitted = await RefundDestination.find({ userId: req.user._id, orderId: { $in: orders.map((order) => order._id) } }).select("orderId").lean();
    const submittedIds = new Set(submitted.map((item) => String(item.orderId)));
    return res.json({ notifications: orders.filter((order) => !submittedIds.has(String(order._id))).map((order) => ({ orderId: String(order._id), message: "Provide UPI or bank details for your COD refund", href: `/my-orders#${order._id}` })) });
  } catch (error) { return fail(res, error); }
});
router.get("/:id", handlers.get);
router.put("/:id", handlers.submit);
router.get("/:id/admin", admin, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
    const details = await RefundDestination.findOne({ orderId: req.params.id }).select("+encryptedDetails");
    if (!details) return res.json({ submitted: false });
    await recordAudit({ user: req.user, action: "order.refund_details_viewed", entityType: "order", entityId: req.params.id, summary: "Administrator viewed refund destination" });
    return res.json({ submitted: true, details: decryptRefundDestination(details.encryptedDetails), submittedAt: details.updatedAt });
  } catch (error) { return fail(res, error); }
});
router.post("/:id/remind", admin, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
    const order = await Order.findById(req.params.id);
    if (!order || !needsRefundDetails(order) || order.refund?.detailsSubmittedAt) return res.status(409).json({ message: "This order does not need a refund-details request" });
    if (!order.email) return res.status(409).json({ message: "This order has no email address. The customer can provide refund details through their account notification." });
    const result = await notifyRefundDetails(order);
    return res.status(result.sent ? 200 : result.skipped ? 409 : 502).json({ message: result.sent ? "Refund details email sent" : result.skipped ? "An email was already sent or recently attempted" : "Email delivery failed. The account notification remains available." });
  } catch (error) { return fail(res, error); }
});
export default router;
