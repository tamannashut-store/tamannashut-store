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

    subtotal: Number,

    discount: { type: Number, default: 0 },

    couponCode: { type: String, default: "" },

    totalAmount: Number,

    paymentId: String,

    razorpayOrderId: String,

    idempotencyKey: String,

    inventoryRestored: { type: Boolean, default: false },

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
    statusHistory: [
      {
        status: String,
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
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
orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
const Order = mongoose.model("Order", orderSchema);

export default Order;
