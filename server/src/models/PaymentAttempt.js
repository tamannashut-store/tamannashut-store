import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, required: true },
  customer: { type: Object, required: true },
  cart: { type: Object, required: true },
  status: { type: String, default: "created" },
  paymentId: { type: String, default: "" },
  failureReason: { type: String, default: "" },
}, { timestamps: true });

paymentAttemptSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
export default mongoose.models.PaymentAttempt || mongoose.model("PaymentAttempt", paymentAttemptSchema);
