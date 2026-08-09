import express from "express";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderEmailTemplate } from "../utils/emailTemplates.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { generatePackingSlip } from "../utils/generatePackingSlip.js";
import { ORDER_STATUSES, canTransitionOrder, getNextOrderStatuses, restoresStockAt } from "../utils/orderLifecycle.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  calculateCart,
  createOrderWithReservedStock,
  restoreOrderStock,
  sendOrderNotifications,
} from "../services/orderService.js";

const router = express.Router();
const serializeOrder = (order) => { const value = order.toObject ? order.toObject() : order; return value.status === "Processing" ? { ...value, status: "Confirmed" } : value; };
const sendStatusUpdate = (order) => sendEmail(order.email, "Order Update - Tamanna's Hut", `<h2>Order status updated</h2><p>Hello ${order.customerName || "Customer"},</p><p>Order <strong>${order._id}</strong> is now <strong>${order.status}</strong>.</p>${order.tracking?.trackingId ? `<p>Tracking: ${order.tracking.trackingId}</p>` : ""}`);

router.post("/", protect, async (req, res) => {
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== "COD") {
      return res.status(400).json({ message: "Online orders must be completed through payment verification" });
    }
    const cart = await calculateCart(req.body.products, req.body.couponCode);
    const result = await createOrderWithReservedStock({
      user: req.user,
      customer: req.body.customer,
      cart,
      payment: { method: "COD", status: "Pending" },
      idempotencyKey: req.body.idempotencyKey,
    });
    if (result.created) await sendOrderNotifications(result.order);
    return res.status(result.created ? 201 : 200).json({ success: true, order: result.order });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get("/invoice/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!req.user.isAdmin && String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    generateInvoice(order, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/packing-slip/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return generatePackingSlip(order, res);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/lifecycle/meta", protect, admin, (_req, res) => res.json({ statuses: ORDER_STATUSES }));

router.post("/resend-invoice/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await sendEmail(order.email, "Invoice - Tamanna's Hut", `${orderEmailTemplate(order)}<hr/>${invoiceTemplate(order)}`);
    return res.json({ success: true, message: "Invoice sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, admin, async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders.map(serializeOrder));
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/cancel/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!req.user.isAdmin && String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const nextStatus = order.status === "Pending" ? "Cancelled" : ["Processing", "Confirmed"].includes(order.status) ? "Cancellation Requested" : null;
    if (!nextStatus) return res.status(400).json({ message: "This order can no longer be cancelled online" });
    if (nextStatus === "Cancelled") await restoreOrderStock(order);
    order.status = nextStatus;
    order.statusHistory.push({ status: nextStatus, note: String(req.body.reason || "Requested by customer").slice(0, 300) });
    await order.save();
    await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ success: true, message: nextStatus === "Cancelled" ? "Order cancelled" : "Cancellation requested", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/return/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!req.user.isAdmin && String(order.userId) !== String(req.user._id)) return res.status(403).json({ message: "Access denied" });
    if (order.status !== "Delivered") return res.status(400).json({ message: "Returns can be requested after delivery" });
    const deliveredAt = [...order.statusHistory].reverse().find((item) => item.status === "Delivered")?.createdAt;
    if (deliveredAt && Date.now() - new Date(deliveredAt).getTime() > 7 * 86400000) return res.status(400).json({ message: "The 7-day return window has closed" });
    const reason = String(req.body.reason || "").trim().slice(0, 500);
    if (!reason) return res.status(400).json({ message: "Please provide a return reason" });
    order.status = "Return Requested";
    order.returnRequest = { reason, requestedAt: new Date() };
    order.statusHistory.push({ status: "Return Requested", note: reason });
    await order.save();
    await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ success: true, order });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;
    const previousTrackingId = order.tracking?.trackingId || "";
    const nextStatus = req.body.status || order.status;
    if (!ORDER_STATUSES.includes(nextStatus)) return res.status(400).json({ message: "Invalid order status" });
    if (!canTransitionOrder(order.status, nextStatus)) return res.status(400).json({ message: `Cannot move an order from ${order.status} to ${nextStatus}` });
    if (restoresStockAt.has(nextStatus) && order.status !== nextStatus) await restoreOrderStock(order);

    const trackingInput = req.body.trackingNumber || req.body.tracking || {};
    order.tracking = {
      trackingId: String(trackingInput.trackingId || order.tracking?.trackingId || "").slice(0, 150),
      courier: String(trackingInput.courier || order.tracking?.courier || "").slice(0, 150),
    };
    const internalNote = String(req.body.internalNote || "").trim().slice(0, 500);
    if (internalNote) order.internalNotes.push({ note: internalNote, createdBy: req.user.email || String(req.user._id) });
    if (req.body.refund) order.refund = {
      status: String(req.body.refund.status || order.refund?.status || "").slice(0, 80),
      amount: Math.max(0, Number(req.body.refund.amount ?? order.refund?.amount ?? 0)),
      reference: String(req.body.refund.reference || order.refund?.reference || "").slice(0, 150),
      reason: String(req.body.refund.reason || order.refund?.reason || "").slice(0, 300),
    };
    if (nextStatus !== order.status) {
      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, note: String(req.body.note || "Status updated by admin").slice(0, 300) });
    }
    const updatedOrder = await order.save();

    if (previousStatus !== order.status || previousTrackingId !== order.tracking?.trackingId) await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ ...updatedOrder.toObject(), allowedNextStatuses: getNextOrderStatuses(updatedOrder.status) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders.map(serializeOrder));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
