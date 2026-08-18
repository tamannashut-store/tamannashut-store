import mongoose from "mongoose";

const sellerSettlementSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  currency: { type: String, default: "INR" },
  grossAmount: { type: Number, required: true, min: 0 },
  allocatedDiscount: { type: Number, default: 0, min: 0 },
  netSalesAmount: { type: Number, required: true, min: 0 },
  commissionPercent: { type: Number, default: 0, min: 0, max: 100 },
  commissionAmount: { type: Number, default: 0, min: 0 },
  refundAmount: { type: Number, default: 0, min: 0 },
  adjustmentAmount: { type: Number, default: 0 },
  adjustmentNote: { type: String, default: "", maxlength: 500 },
  payableAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "eligible", "held", "paid", "reversed"],
    default: "pending",
    index: true,
  },
  manualHold: { type: Boolean, default: false },
  holdReason: { type: String, default: "", maxlength: 500 },
  eligibleAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  paymentMethod: { type: String, default: "", maxlength: 80 },
  paymentReference: { type: String, default: "", maxlength: 150 },
  lineItems: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    sku: String,
    quantity: Number,
    amount: Number,
  }],
  history: [{
    status: String,
    note: { type: String, default: "" },
    createdBy: { type: String, default: "system" },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

sellerSettlementSchema.index({ sellerId: 1, orderId: 1 }, { unique: true });
sellerSettlementSchema.index({ status: 1, eligibleAt: 1 });

export default mongoose.models.SellerSettlement || mongoose.model("SellerSettlement", sellerSettlementSchema);
