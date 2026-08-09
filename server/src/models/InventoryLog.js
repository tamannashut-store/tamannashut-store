import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: String,
    size: String,
    previousStock: Number,
    newStock: Number,
    change: Number,
    reason: { type: String, default: "Manual adjustment" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.models.InventoryLog || mongoose.model("InventoryLog", inventoryLogSchema);
