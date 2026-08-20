import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    slug: { type: String, trim: true, lowercase: true },
    price: { type: Number, required: true },
    mrp: { type: Number },
    baseSku: { type: String, trim: true, uppercase: true },
    hsnCode: { type: String, trim: true },
    description: String,
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        color: { type: String, trim: true, default: "" },
        size: { type: String, trim: true, default: "" },
      },
    ],
    category: String,
    color: { type: String, trim: true },
    fabric: { type: String, trim: true },
    ageGroup: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
      index: true,
    },
    approvalNote: { type: String, default: "", trim: true, maxlength: 500 },
    sellerComplianceHold: { type: Boolean, default: false, index: true },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lowStockThreshold: { type: Number, default: 3, min: 0 },

    sizeStock: [
      {
        size: String,
        stock: Number,
      },
    ],
    variants: [
      {
        sku: { type: String, trim: true, uppercase: true },
        size: { type: String, trim: true },
        color: { type: String, trim: true },
        stock: { type: Number, default: 0, min: 0 },
        price: { type: Number, min: 0 },
        active: { type: Boolean, default: true },
      },
    ],

    reviews: [
      {
        userId: String,
        name: String,
        rating: Number,
        comment: String,
        verifiedPurchase: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "approved",
        },
        moderatedAt: Date,
        moderatedBy: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    averageRating: {
      type: Number,
      default: 0,
    },
    approvedReviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ status: 1, color: 1, fabric: 1, ageGroup: 1 });
productSchema.index({ sellerId: 1, updatedAt: -1 });
productSchema.index({ sellerId: 1, approvalStatus: 1, status: 1, sellerComplianceHold: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
