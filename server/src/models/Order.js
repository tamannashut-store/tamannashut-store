import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: String,

    email: String,

    phone: String,

    address: String,

    city: String,

    pincode: String,

    products: Array,

    totalAmount: Number,

    paymentId: String,

    paymentMethod: {
      type: String,
      default: "Online",
    },

    paymentStatus: {
      type: String,
      default: "Paid",
    },

    status: {
      type: String,
      default: "Pending",
    },
    tracking: {
      trackingId: {
        type: String,
        default: ""
      },
      courier: {
        type: String,
        default: ""
      }
    },
  },
  {
    timestamps: true,
  }
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
const Order = mongoose.model("Order", orderSchema);

export default Order;