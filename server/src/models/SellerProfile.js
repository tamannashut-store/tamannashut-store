import mongoose from "mongoose";

const sellerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  legalBusinessName: { type: String, required: true, trim: true, maxlength: 120 },
  gstinEncrypted: { type: String, required: true, select: false },
  gstinLast4: { type: String, required: true },
  panEncrypted: { type: String, required: true, select: false },
  panLast4: { type: String, required: true },
  bankAccountHolder: { type: String, required: true, trim: true, maxlength: 120 },
  bankAccountEncrypted: { type: String, required: true, select: false },
  bankAccountLast4: { type: String, required: true },
  ifscEncrypted: { type: String, required: true, select: false },
  ifscLast4: { type: String, required: true },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewNote: { type: String, default: "", maxlength: 500 },
}, { timestamps: true });

export default mongoose.models.SellerProfile || mongoose.model("SellerProfile", sellerProfileSchema);
