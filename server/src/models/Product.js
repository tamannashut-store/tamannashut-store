import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
  },

  image: {
    type: String,
  },
  category: {
    type: String,
  },
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
}, {
  timestamps: true,
});

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;