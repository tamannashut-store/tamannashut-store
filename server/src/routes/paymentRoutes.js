import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { protect } from "../middleware/authMiddleware.js";
import {
  calculateCart,
  createOrderWithReservedStock,
  normalizeCustomer,
  sendOrderNotifications,
} from "../services/orderService.js";

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", protect, async (req, res) => {
  try {
    normalizeCustomer(req.body.customer);
    const cart = await calculateCart(req.body.products, req.body.couponCode);
    if (cart.totalAmount <= 0) return res.status(400).json({ message: "Order amount must be greater than zero" });

    const order = await razorpay.orders.create({
      amount: Math.round(cart.totalAmount * 100),
      currency: "INR",
      receipt: `th_${Date.now()}_${String(req.user._id).slice(-6)}`,
      notes: { userId: String(req.user._id) },
    });
    return res.json({ ...order, pricing: cart });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Incomplete payment response" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const receivedBuffer = Buffer.from(String(razorpay_signature));
    const expectedBuffer = Buffer.from(expected);
    if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const [razorpayOrder, razorpayPayment, cart] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
      calculateCart(req.body.products, req.body.couponCode),
    ]);
    const expectedAmount = Math.round(cart.totalAmount * 100);
    if (
      razorpayOrder.notes?.userId !== String(req.user._id) ||
      Number(razorpayOrder.amount) !== expectedAmount ||
      razorpayPayment.order_id !== razorpay_order_id ||
      Number(razorpayPayment.amount) !== expectedAmount ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(409).json({ message: "Payment amount or status could not be verified" });
    }

    let result;
    try {
      result = await createOrderWithReservedStock({
        user: req.user,
        customer: req.body.customer,
        cart,
        payment: {
          method: "Online",
          status: "Paid",
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        },
        idempotencyKey: req.body.idempotencyKey,
      });
    } catch (orderError) {
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: expectedAmount,
          notes: { reason: "Order could not be confirmed" },
        });
        orderError.message = `${orderError.message}. Your payment has been refunded.`;
      } catch (refundError) {
        console.error("AUTOMATIC REFUND FAILED", refundError);
        orderError.message = `${orderError.message}. Please contact support with payment ID ${razorpay_payment_id}.`;
      }
      throw orderError;
    }
    if (result.created) await sendOrderNotifications(result.order);
    return res.status(result.created ? 201 : 200).json({ success: true, order: result.order });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export default router;
