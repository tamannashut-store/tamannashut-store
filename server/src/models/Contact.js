import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Contact",
  contactSchema
);
