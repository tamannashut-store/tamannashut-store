import mongoose from "mongoose";

const schema = new mongoose.Schema({
  // One record per browser/product, including across multiple server instances.
  _id: String,
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  visitorId: { type: String, required: true },
  lastSeen: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
schema.index({ productId: 1, lastSeen: 1 });

export default mongoose.models.ProductPresence || mongoose.model("ProductPresence", schema);
