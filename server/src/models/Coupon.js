import mongoose from "mongoose";

const couponSchema =
  new mongoose.Schema({

    code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },

    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
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
