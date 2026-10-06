import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ["register", "login", "delete", "link-email"], required: true },
  channel: { type: String, enum: ["email", "phone"], required: true },
  contact: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionVersion: Number,
  name: String,
  marketingConsent: Boolean,
  nonceHash: { type: String, required: true },
  codeHash: String,
  attempts: { type: Number, default: 0 },
  ready: { type: Boolean, default: false },
  sentAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.models.CustomerAuthChallenge || mongoose.model("CustomerAuthChallenge", schema);
