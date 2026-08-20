import mongoose from "mongoose";

const adCampaignSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  placement: { type: String, enum: ["home", "shop"], required: true },
  packageKey: { type: String, enum: ["starter", "growth", "boost"], required: true },
  durationDays: { type: Number, required: true, min: 1, max: 30 },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: "INR", immutable: true },
  status: {
    type: String,
    enum: ["payment_pending", "pending_review", "active", "paused", "rejected", "completed", "cancelled"],
    default: "payment_pending",
    index: true,
  },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  paidAt: Date,
  startsAt: Date,
  endsAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  refundStatus: { type: String, enum: ["not_required", "submitted", "processed", "failed"], default: "not_required" },
  refundId: { type: String, default: "" },
  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

adCampaignSchema.index({ status: 1, placement: 1, startsAt: 1, endsAt: 1 });
adCampaignSchema.index({ sellerId: 1, createdAt: -1 });
adCampaignSchema.index(
  { sellerId: 1, productId: 1, placement: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["payment_pending", "pending_review", "active", "paused"] } } }
);

export default mongoose.model("AdCampaign", adCampaignSchema);
