import mongoose from "mongoose";

const schema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  method: { type: String, enum: ["UPI", "Bank transfer"], required: true },
  maskedDestination: { type: String, required: true },
  encryptedDetails: { type: String, required: true, select: false },
}, { timestamps: true, toJSON: { transform: (_doc, value) => { delete value.encryptedDetails; return value; } }, toObject: { transform: (_doc, value) => { delete value.encryptedDetails; return value; } } });

export default mongoose.models.RefundDestination || mongoose.model("RefundDestination", schema);
