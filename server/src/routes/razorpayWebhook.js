import crypto from "crypto";
import Order from "../models/Order.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import User from "../models/User.js";
import { createOrderWithReservedStock, sendOrderNotifications } from "../services/orderService.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ message: "Payment webhook is not configured" });
    const signature = String(req.headers["x-razorpay-signature"] || "");
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    const received = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) return res.status(401).json({ message: "Invalid webhook signature" });

    const event = JSON.parse(req.body.toString("utf8"));
    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;

    if (event.event === "payment.captured" && payment?.order_id) {
      const existing = await Order.findOne({ $or: [{ razorpayOrderId: payment.order_id }, { paymentId: payment.id }] });
      if (!existing) {
        const attempt = await PaymentAttempt.findOne({ razorpayOrderId: payment.order_id });
        if (attempt) {
          const user = await User.findById(attempt.userId);
          if (user) {
            const result = await createOrderWithReservedStock({ user, customer: attempt.customer, cart: attempt.cart, payment: { method: "Online", status: "Paid", paymentId: payment.id, razorpayOrderId: payment.order_id }, idempotencyKey: attempt.idempotencyKey });
            attempt.status = "completed"; attempt.paymentId = payment.id; await attempt.save();
            if (result.created) await sendOrderNotifications(result.order);
          }
        }
      }
    } else if (event.event === "payment.failed" && payment?.order_id) {
      await PaymentAttempt.updateOne({ razorpayOrderId: payment.order_id }, { $set: { status: "failed", paymentId: payment.id || "", failureReason: payment.error_description || payment.error_reason || "Payment failed" } });
    } else if (event.event === "refund.processed" && refund?.payment_id) {
      const order = await Order.findOne({ paymentId: refund.payment_id });
      if (order) {
        order.paymentStatus = "Refunded";
        order.refund = { status: "Refunded", amount: Number(refund.amount || 0) / 100, reference: refund.id || "", reason: refund.notes?.reason || "" };
        if (order.status === "Refund Pending") { order.status = "Refunded"; order.statusHistory.push({ status: "Refunded", note: "Refund confirmed by Razorpay" }); }
        await order.save();
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("RAZORPAY WEBHOOK ERROR", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};
