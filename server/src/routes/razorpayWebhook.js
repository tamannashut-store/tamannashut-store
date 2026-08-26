import crypto from "crypto";
import * as Sentry from "@sentry/node";
import Order from "../models/Order.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import User from "../models/User.js";
import { createOrderWithReservedStock, sendOrderNotifications } from "../services/orderService.js";
import { razorpayWebhookContext } from "../utils/webhookMonitoring.js";
import { syncOrderSettlementsSafely } from "../services/sellerSettlementService.js";
import AdCampaign from "../models/AdCampaign.js";
import { razorpayIdFromInput } from "../utils/inputSecurity.js";

export const razorpayWebhook = async (req, res) => {
  let event;
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ message: "Payment webhook is not configured" });
    const signature = String(req.headers["x-razorpay-signature"] || "");
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    const received = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) return res.status(401).json({ message: "Invalid webhook signature" });

    event = JSON.parse(req.body.toString("utf8"));
    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;

    if (event.event === "payment.captured" && payment?.order_id) {
      const razorpayOrderId = razorpayIdFromInput(payment.order_id, "order", "Razorpay order identifier");
      const razorpayPaymentId = razorpayIdFromInput(payment.id, "pay", "Razorpay payment identifier");
      const adCampaign = await AdCampaign.findOne({ razorpayOrderId: razorpayOrderId });
      if (adCampaign) {
        if (Number(payment.amount) !== Math.round(adCampaign.amount * 100)) throw new Error("Seller ad payment amount did not match its campaign");
        if (["payment_pending", "cancelled"].includes(adCampaign.status)) await AdCampaign.updateOne({ _id: adCampaign._id, status: { $in: ["payment_pending", "cancelled"] } }, { $set: { status: "pending_review", razorpayPaymentId, paidAt: new Date() } });
        return res.status(200).json({ received: true });
      }
      const existing = await Order.findOne({ $or: [{ razorpayOrderId: razorpayOrderId }, { paymentId: razorpayPaymentId }] });
      if (!existing) {
        const attempt = await PaymentAttempt.findOne({ razorpayOrderId: razorpayOrderId });
        if (attempt) {
          const user = await User.findById(attempt.userId);
          if (user) {
            const result = await createOrderWithReservedStock({ user, customer: attempt.customer, cart: attempt.cart, payment: { method: "Online", status: "Paid", paymentId: razorpayPaymentId, razorpayOrderId: razorpayOrderId }, idempotencyKey: attempt.idempotencyKey });
            attempt.status = "completed"; attempt.paymentId = razorpayPaymentId; await attempt.save();
            if (result.created) await sendOrderNotifications(result.order);
          }
        }
      }
    } else if (event.event === "payment.failed" && payment?.order_id) {
      const razorpayOrderId = razorpayIdFromInput(payment.order_id, "order", "Razorpay order identifier");
      const razorpayPaymentId = payment.id ? razorpayIdFromInput(payment.id, "pay", "Razorpay payment identifier") : "";
      await AdCampaign.updateOne({ razorpayOrderId: razorpayOrderId, status: "payment_pending" }, { $set: { status: "cancelled" } });
      await PaymentAttempt.updateOne({ razorpayOrderId: razorpayOrderId }, { $set: { status: "failed", paymentId: razorpayPaymentId, failureReason: String(payment.error_description || payment.error_reason || "Payment failed").slice(0, 300) } });
    } else if (["refund.created", "refund.processed", "refund.failed"].includes(event.event) && refund?.payment_id) {
      const razorpayPaymentId = razorpayIdFromInput(refund.payment_id, "pay", "Razorpay payment identifier");
      const adCampaign = await AdCampaign.findOne({ razorpayPaymentId });
      if (adCampaign) {
        adCampaign.refundId = refund.id || adCampaign.refundId || "";
        adCampaign.refundStatus = event.event === "refund.processed" ? "processed" : event.event === "refund.failed" ? "failed" : "submitted";
        await adCampaign.save();
        return res.status(200).json({ received: true });
      }
      const order = await Order.findOne({ paymentId: razorpayPaymentId });
      if (order) {
        order.refund.amount = Number(refund.amount || 0) / 100;
        order.refund.reference = refund.id || order.refund.reference || "";
        order.refund.reason = refund.notes?.reason || order.refund.reason || "";
        order.refund.arn = refund.acquirer_data?.arn || refund.acquirer_data?.rrn || order.refund.arn || "";
        if (event.event === "refund.processed") {
          order.paymentStatus = "Refunded"; order.refund.status = "Processed"; order.refund.processedAt = new Date();
          if (order.status === "Refund Pending") { order.status = "Refunded"; order.statusHistory.push({ status: "Refunded", note: "Refund confirmed by Razorpay" }); }
        } else if (event.event === "refund.failed") {
          order.refund.status = "Failed"; order.refund.failedReason = refund.error_description || "Razorpay could not process the refund";
          if (order.status === "Refund Pending") { order.status = order.refund.previousOrderStatus || "Cancelled"; order.statusHistory.push({ status: order.status, note: "Refund failed; admin action required" }); }
        } else { order.refund.status = "Pending"; }
        await order.save();
        await syncOrderSettlementsSafely(order);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("integration", "razorpay");
      scope.setTag("webhook.processing", "failed");
      scope.setContext("payment_event", razorpayWebhookContext(event));
      Sentry.captureException(error);
    });
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Webhook processing failed" });
  }
};
