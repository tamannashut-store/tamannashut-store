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
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
mongoose.model("User", userSchema);