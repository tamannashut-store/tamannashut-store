import mongoose from "mongoose";

const couponSchema =
  new mongoose.Schema({

    code: {
      type: String,
      unique: true,
    },

    discount: {
      type: Number,
    },

    active: {
      type: Boolean,
      default: true,
    },

    expiryDate: {
      type: Date,
    },

  });

export default mongoose.model(
  "Coupon",
  couponSchema
);