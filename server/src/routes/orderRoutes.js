import express from "express";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderEmailTemplate } from "../utils/emailTemplates.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  calculateCart,
  createOrderWithReservedStock,
  restoreOrderStock,
  sendOrderNotifications,
} from "../services/orderService.js";

const router = express.Router();
const allowedStatuses = new Set(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]);

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
    return res.json(orders);
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
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }
    await restoreOrderStock(order);
    order.status = "Cancelled";
    order.statusHistory.push({ status: "Cancelled", note: String(req.body.reason || "Cancelled by customer").slice(0, 300) });
    await order.save();
    return res.json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const nextStatus = req.body.status || order.status;
    if (!allowedStatuses.has(nextStatus)) return res.status(400).json({ message: "Invalid order status" });
    if (order.status === "Cancelled" && nextStatus !== "Cancelled") {
      return res.status(400).json({ message: "A cancelled order cannot be reopened" });
    }
    if (nextStatus === "Cancelled" && order.status !== "Cancelled") await restoreOrderStock(order);

    const trackingInput = req.body.trackingNumber || req.body.tracking || {};
    order.tracking = {
      trackingId: String(trackingInput.trackingId || order.tracking?.trackingId || "").slice(0, 150),
      courier: String(trackingInput.courier || order.tracking?.courier || "").slice(0, 150),
    };
    if (nextStatus !== order.status) {
      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, note: String(req.body.note || "Status updated by admin").slice(0, 300) });
    }
    const updatedOrder = await order.save();

    await Promise.allSettled([
      sendEmail(
        order.email,
        "Order Update - Tamanna's Hut",
        `<h2>Order status updated</h2><p>Hello ${order.customerName || "Customer"},</p><p>Order <strong>${order._id}</strong> is now <strong>${order.status}</strong>.</p>${order.tracking?.trackingId ? `<p>Tracking: ${order.tracking.trackingId}</p>` : ""}`
      ),
    ]);
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
