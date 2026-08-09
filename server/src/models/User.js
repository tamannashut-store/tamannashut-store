import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
    },

    password: String,

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

    pincode: {
      type: String,
      default: "",
    },

    isAdmin: {
      type: Boolean,
      default: false,
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
