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

    password: { type: String, required: true, select: false },
    passwordChangedAt: { type: Date, default: null, select: false },
    sessionVersion: { type: Number, default: 0, min: 0 },
    passwordResetToken: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date, default: null },
    termsAcceptedAt: { type: Date, default: null },
    emailVerificationRequiredAt: { type: Date, default: null, select: false },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null, select: false, index: true },
    emailVerificationExpires: { type: Date, default: null, select: false },
    emailVerificationSentAt: { type: Date, default: null, select: false },
    twoFactorCodeHash: { type: String, default: null, select: false },
    twoFactorExpires: { type: Date, default: null, select: false },
    twoFactorAttempts: { type: Number, default: 0, min: 0, select: false },

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
    accountType: {
      type: String,
      enum: ["customer", "platform_admin", "seller"],
      default: "customer",
      index: true,
    },
    sellerRole: { type: String, enum: ["", "owner", "member"], default: "" },
    sellerAccessStatus: { type: String, enum: ["active", "pending", "rejected", "suspended", "closed"], default: "active" },
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
    toJSON: {
      transform: (_document, value) => {
        delete value.password;
        delete value.passwordResetToken;
        delete value.passwordResetExpires;
        delete value.emailVerificationRequiredAt;
        delete value.emailVerificationToken;
        delete value.emailVerificationExpires;
        delete value.emailVerificationSentAt;
        delete value.twoFactorCodeHash;
        delete value.twoFactorExpires;
        delete value.twoFactorAttempts;
        return value;
      },
    },
  }
);

export default mongoose.models.User ||
mongoose.model("User", userSchema);
