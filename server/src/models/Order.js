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

    state: String,

    pincode: String,

    products: Array,

    subtotal: Number,

    discount: { type: Number, default: 0 },

    couponCode: { type: String, default: "" },

    promotionCode: { type: String, default: "" },

    welcomeDiscountPhoneHash: { type: String, default: undefined },

    totalAmount: Number,

    paymentId: String,

    razorpayOrderId: String,

    idempotencyKey: String,

    invoiceNumber: { type: String, trim: true },

    inventoryRestored: { type: Boolean, default: false },

    paymentMethod: {
      type: String,
      enum: ["Online", "COD"],
      default: "Online",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Not Collected", "Refunded"],
      default: "Pending",
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
    internalNotes: [{ note: String, createdBy: String, createdAt: { type: Date, default: Date.now } }],
    refund: {
      status: { type: String, default: "" },
      method: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      reference: { type: String, default: "" },
      reason: { type: String, default: "" },
      idempotencyKey: { type: String, default: "" },
      arn: { type: String, default: "" },
      requestedAt: Date,
      processedAt: Date,
      failedReason: { type: String, default: "" },
      previousOrderStatus: { type: String, default: "" },
    },
    returnRequest: {
      reason: { type: String, default: "" },
      requestedAt: Date,
      reviewStatus: { type: String, default: "" },
      adminNote: { type: String, default: "" },
      reviewedAt: Date,
      evidence: [{ url: String, public_id: String }],
      reverseOrderId: { type: String, default: "" },
      reverseShipmentId: { type: String, default: "" },
      reverseAwb: { type: String, default: "" },
      reversePickupScheduled: { type: Boolean, default: false },
    },
    cancellationRequest: {
      reason: { type: String, default: "" },
      requestedAt: Date,
      requestedBy: { type: String, default: "" },
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
    shipping: {
      provider: { type: String, default: "" },
      externalOrderId: { type: String, default: "" },
      shipmentId: { type: String, default: "" },
      awbCode: { type: String, default: "" },
      courierId: { type: Number, default: null },
      courierName: { type: String, default: "" },
      externalStatus: { type: String, default: "" },
      labelUrl: { type: String, default: "" },
      pickupScheduled: { type: Boolean, default: false },
      destinationState: { type: String, default: "" },
      package: {
        weight: { type: Number, default: 0.5 },
        length: { type: Number, default: 15 },
        breadth: { type: Number, default: 12 },
        height: { type: Number, default: 5 },
      },
      lastEventAt: Date,
    },
    sellerFulfillments: [{
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      status: { type: String, enum: ["pending", "ready", "shipped", "delivered", "cancelled", "returned"], default: "pending" },
      itemSkus: [{ type: String }],
      pickupAddress: {
        line1: String, line2: String, city: String, state: String, pincode: String,
      },
      provider: { type: String, default: "platform_managed" },
      shipmentId: { type: String, default: "" },
      awbCode: { type: String, default: "" },
      courierName: { type: String, default: "" },
      labelUrl: { type: String, default: "" },
      updatedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "shipping.awbCode": 1 }, { sparse: true });
orderSchema.index({ "shipping.shipmentId": 1 }, { sparse: true });
orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
orderSchema.index({ welcomeDiscountPhoneHash: 1 }, { unique: true, sparse: true });
orderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ userId: 1, status: 1, "products._id": 1 });
orderSchema.index({ "products.sellerId": 1, createdAt: -1 });
orderSchema.index({ "sellerFulfillments.sellerId": 1, createdAt: -1 });
const Order = mongoose.model("Order", orderSchema);

export default Order;
