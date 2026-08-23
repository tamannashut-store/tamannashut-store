import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["customer", "admin"], required: true },
    body: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const contactSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    topic: { type: String, enum: ["general", "order", "delivery", "return", "payment"], default: "general" },
    orderReference: { type: String, trim: true, maxlength: 40, default: "" },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    readAt: { type: Date, default: null },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    replies: { type: [replySchema], default: [] },
    customerLastReadAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ customerId: 1, lastActivityAt: -1 });

export default mongoose.model(
  "Contact",
  contactSchema
);
