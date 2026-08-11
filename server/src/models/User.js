import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: { type: String, required: true },
    passwordResetToken: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },
    State: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },
    marketingConsent: { type: Boolean, default: false },
    cartUpdatedAt: { type: Date, default: null, index: true },
    cartRecovery: {
      lastSentAt: { type: Date, default: null },
      lastCartUpdatedAt: { type: Date, default: null },
    },
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        selectedSize: { type: String, required: true, trim: true },
        selectedSku: { type: String, default: "", trim: true, uppercase: true },
        qty: { type: Number, required: true, min: 1, max: 20 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
mongoose.model("User", userSchema);
