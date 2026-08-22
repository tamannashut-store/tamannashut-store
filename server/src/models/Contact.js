import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    topic: { type: String, enum: ["general", "order", "delivery", "return", "payment"], default: "general" },
    orderReference: { type: String, trim: true, maxlength: 40, default: "" },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    readAt: { type: Date, default: null },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Contact",
  contactSchema
);
