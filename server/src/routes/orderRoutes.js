import express from "express";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderStatusEmailTemplate } from "../utils/emailTemplates.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { generatePackingSlip } from "../utils/generatePackingSlip.js";
import { ORDER_STATUSES, canTransitionOrder, getNextOrderStatuses, restoresStockAt, syncCodPaymentStatus } from "../utils/orderLifecycle.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  calculateCart,
  createOrderWithReservedStock,
  restoreOrderStock,
  sendOrderNotifications,
} from "../services/orderService.js";
import { cancelShiprocketShipment, verifyShiprocketDeliveryPostcode } from "../services/shiprocketService.js";
import { createRazorpayRefund } from "../services/refundService.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { recordAudit } from "../utils/recordAudit.js";

const router = express.Router();
const serializeOrder = (order) => { const value = order.toObject ? order.toObject() : order; return value.status === "Processing" ? { ...value, status: "Confirmed" } : value; };
const sendStatusUpdate = (order) => sendEmail(order.email, `Order ${order.status} - Tamanna's Hut`, orderStatusEmailTemplate(order));

router.post("/", protect, async (req, res) => {
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== "COD") {
      return res.status(400).json({ message: "Online orders must be completed through payment verification" });
    }
    const locality = await verifyShiprocketDeliveryPostcode(req.body.customer?.pincode, true);
    req.body.customer = { ...req.body.customer, city: locality.city, state: locality.state, pincode: locality.pincode };
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
    await sendEmail(order.email, `Invoice ${String(order._id).slice(-8).toUpperCase()} - Tamanna's Hut`, invoiceTemplate(order));
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
    const cancellationReason = String(req.body.reason || "Requested by customer").trim().slice(0, 300);
    order.status = nextStatus;
    syncCodPaymentStatus(order, nextStatus);
    order.cancellationRequest = { reason: cancellationReason, requestedAt: new Date(), requestedBy: req.user.isAdmin ? "Admin" : "Customer" };
    order.statusHistory.push({ status: nextStatus, note: cancellationReason });
    await order.save();
    await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ success: true, message: nextStatus === "Cancelled" ? "Order cancelled" : "Cancellation requested", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const uploadReturnEvidence = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder: "tamannas-hut-return-evidence", resource_type: "image" }, (error, result) => error ? reject(error) : resolve({ url: result.secure_url, public_id: result.public_id }));
  streamifier.createReadStream(file.buffer).pipe(stream);
});

router.post("/return/:id", protect, upload.array("images", 3), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!req.user.isAdmin && String(order.userId) !== String(req.user._id)) return res.status(403).json({ message: "Access denied" });
    if (order.status !== "Delivered") return res.status(400).json({ message: "Returns can be requested after delivery" });
    const deliveredAt = [...order.statusHistory].reverse().find((item) => item.status === "Delivered")?.createdAt;
    if (deliveredAt && Date.now() - new Date(deliveredAt).getTime() > 7 * 86400000) return res.status(400).json({ message: "The 7-day return window has closed" });
    const reason = String(req.body.reason || "").trim().slice(0, 500);
    if (reason.length < 10) return res.status(400).json({ message: "Please describe the return reason in at least 10 characters" });
    order.status = "Return Requested";
    const evidence = req.files?.length ? await Promise.all(req.files.map(uploadReturnEvidence)) : [];
    order.returnRequest = { reason, requestedAt: new Date(), reviewStatus: "Pending", evidence };
    order.statusHistory.push({ status: "Return Requested", note: reason });
    await order.save();
    await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ success: true, order });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/:id/refund", protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  try {
    if (order.paymentMethod !== "Online" || !order.paymentId || order.paymentStatus !== "Paid") return res.status(400).json({ message: "Only captured online payments can be refunded here" });
    if (!["Cancelled", "Returned", "RTO Delivered", "Refund Pending"].includes(order.status)) return res.status(400).json({ message: "Complete the cancellation or return before initiating a refund" });
    if (["Pending", "Processed", "Refunded"].includes(order.refund?.status)) return res.status(409).json({ message: `Refund is already ${String(order.refund.status).toLowerCase()}` });
    const amount = Number(req.body.amount);
    const reason = String(req.body.reason || "Customer order refund").trim().slice(0, 300);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(order.totalAmount)) return res.status(400).json({ message: "Refund amount must be greater than zero and no more than the order total" });
    const previousOrderStatus = order.status === "Refund Pending" ? order.refund?.previousOrderStatus || "Cancelled" : order.status;
    // One stable key per order prevents concurrent admin requests from creating
    // multiple refunds, even if the submitted amounts differ.
    const idempotencyKey = order.refund?.idempotencyKey || `refund_${String(order._id)}`;
    order.refund = { ...order.refund?.toObject?.(), status: "Pending", amount, reason, idempotencyKey, requestedAt: new Date(), previousOrderStatus, failedReason: "" };
    if (order.status !== "Refund Pending") { order.status = "Refund Pending"; order.statusHistory.push({ status: "Refund Pending", note: "Refund initiated by admin" }); }
    await order.save();
    try {
      const refund = await createRazorpayRefund({ paymentId: order.paymentId, amount, reason, orderId: order._id, idempotencyKey });
      order.refund.status = refund.status === "processed" ? "Processed" : "Pending";
      order.refund.reference = refund.id || "";
      order.refund.arn = refund.acquirer_data?.arn || refund.acquirer_data?.rrn || "";
      if (refund.status === "processed") { order.paymentStatus = "Refunded"; order.status = "Refunded"; order.refund.processedAt = new Date(); order.statusHistory.push({ status: "Refunded", note: "Refund processed by Razorpay" }); }
      await order.save();
      await recordAudit({ user: req.user, action: "order.refund_requested", entityType: "order", entityId: order._id, summary: `Refund ${amount} requested`, metadata: { amount, reference: order.refund.reference || "" } });
      await Promise.allSettled([sendStatusUpdate(order)]);
      return res.json({ success: true, order });
    } catch (error) {
      order.refund.failedReason = String(error.message || "Refund request failed").slice(0, 300);
      if (error.status === 400) { order.refund.status = "Failed"; order.refund.idempotencyKey = ""; order.status = previousOrderStatus; order.statusHistory.push({ status: previousOrderStatus, note: "Refund attempt failed; no refund was created" }); }
      await order.save();
      return res.status(error.status || 500).json({ message: error.message });
    }
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

router.post("/:id/refund/complete-cod", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentMethod !== "COD") return res.status(400).json({ message: "Only COD refunds can be completed manually. Online refunds are confirmed by Razorpay." });
    if (order.paymentStatus === "Not Collected") return res.status(400).json({ message: "No COD payment was collected, so this order cannot be refunded" });
    if (order.status === "Refunded" && order.refund?.status === "Processed") return res.json({ success: true, order });
    if (order.status !== "Refund Pending") return res.status(400).json({ message: "Move the order to Refund Pending before recording the COD refund" });

    const methods = ["UPI", "Bank transfer", "Cash", "Other"];
    const method = String(req.body.method || "").trim();
    const reference = String(req.body.reference || "").trim().slice(0, 150);
    const reason = String(req.body.reason || "COD order refund completed").trim().slice(0, 300);
    const amount = Number(req.body.amount);
    if (!methods.includes(method)) return res.status(400).json({ message: "Select a valid refund method" });
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(order.totalAmount)) return res.status(400).json({ message: "Refund amount must be greater than zero and no more than the order total" });
    if (method !== "Cash" && reference.length < 3) return res.status(400).json({ message: "Enter the UPI or bank transaction reference" });

    const priorLifecycleStatus = [...(order.statusHistory || [])].reverse().find((entry) => entry.status !== "Refund Pending")?.status || "Cancelled";
    order.refund = {
      ...order.refund?.toObject?.(), status: "Processed", method, amount, reference,
      reason, requestedAt: order.refund?.requestedAt || new Date(), processedAt: new Date(),
      previousOrderStatus: order.refund?.previousOrderStatus || priorLifecycleStatus, failedReason: "",
    };
    order.paymentStatus = "Refunded";
    order.status = "Refunded";
    order.statusHistory.push({ status: "Refunded", note: `COD refund completed via ${method}${reference ? ` (reference ${reference})` : ""}` });
    await order.save();
    await recordAudit({ user: req.user, action: "order.cod_refund_completed", entityType: "order", entityId: order._id, summary: `COD refund ${amount} completed`, metadata: { amount, method, reference } });
    await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ success: true, order });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;
    const previousTrackingId = order.tracking?.trackingId || "";
    const nextStatus = req.body.status || order.status;
    if (!ORDER_STATUSES.includes(nextStatus)) return res.status(400).json({ message: "Invalid order status" });
    if (nextStatus === "Refunded" && nextStatus !== order.status) return res.status(400).json({ message: "Refunded status can only be confirmed by Razorpay" });
    if (nextStatus === "Refund Pending" && order.paymentMethod === "COD" && order.paymentStatus === "Not Collected") return res.status(400).json({ message: "This COD order was not collected, so no customer refund is due" });
    if (!canTransitionOrder(order.status, nextStatus)) return res.status(400).json({ message: `Cannot move an order from ${order.status} to ${nextStatus}` });
    if (nextStatus === "Cancelled" && order.shipping?.awbCode && order.shipping?.externalStatus !== "Shipment cancelled") {
      if (order.shipping.pickupScheduled) return res.status(400).json({ message: "Cancel the active pickup in Shiprocket before cancelling this order" });
      await cancelShiprocketShipment(order.shipping.awbCode);
      order.shipping.externalStatus = "Shipment cancelled";
    }
    if (restoresStockAt.has(nextStatus) && order.status !== nextStatus) await restoreOrderStock(order);

    const trackingInput = req.body.trackingNumber || req.body.tracking || {};
    order.tracking = {
      trackingId: String(trackingInput.trackingId || order.tracking?.trackingId || "").slice(0, 150),
      courier: String(trackingInput.courier || order.tracking?.courier || "").slice(0, 150),
    };
    const internalNote = String(req.body.internalNote || "").trim().slice(0, 500);
    if (internalNote) order.internalNotes.push({ note: internalNote, createdBy: req.user.email || String(req.user._id) });
    if (nextStatus !== order.status) {
      if (order.status === "Return Requested" && ["Return Approved", "Delivered"].includes(nextStatus)) {
        order.returnRequest.reviewStatus = nextStatus === "Return Approved" ? "Approved" : "Rejected";
        order.returnRequest.adminNote = String(req.body.note || (nextStatus === "Return Approved" ? "Return approved" : "Return request declined")).slice(0, 300);
        order.returnRequest.reviewedAt = new Date();
      }
      order.status = nextStatus;
      syncCodPaymentStatus(order, nextStatus);
      order.statusHistory.push({ status: nextStatus, note: String(req.body.note || "Status updated by admin").slice(0, 300) });
    }
    const updatedOrder = await order.save();

    if (previousStatus !== order.status) await recordAudit({ user: req.user, action: "order.status_changed", entityType: "order", entityId: order._id, summary: `${previousStatus} to ${order.status}`, metadata: { from: previousStatus, to: order.status } });
    if (previousTrackingId !== order.tracking?.trackingId) await recordAudit({ user: req.user, action: "order.tracking_changed", entityType: "order", entityId: order._id, summary: "Tracking information updated", metadata: { courier: order.tracking?.courier || "" } });

    if (previousStatus !== order.status || previousTrackingId !== order.tracking?.trackingId) await Promise.allSettled([sendStatusUpdate(order)]);
    return res.json({ ...updatedOrder.toObject(), allowedNextStatuses: getNextOrderStatuses(updatedOrder.status) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
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
