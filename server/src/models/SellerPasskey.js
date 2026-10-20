import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  credentialId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  publicKey: { type: Buffer, required: true, select: false },
  counter: { type: Number, required: true, min: 0 },
  transports: [String],
  name: { type: String, required: true, maxlength: 60 },
  lastUsedAt: Date,
}, { timestamps: true });

export default mongoose.models.SellerPasskey || mongoose.model('SellerPasskey', schema);
