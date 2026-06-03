import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    image: String,
    category: String,

    sizeStock: [
      {
        size: String,
        stock: Number,
      },
    ],

    reviews: [
      {
        userId: String,
        name: String,
        rating: Number,
        comment: String,
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
  },
  {
    timestamps: true,
  }
);
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;