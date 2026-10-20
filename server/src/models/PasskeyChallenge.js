import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  kind: { type: String, enum: ['email', 'register', 'authenticate'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionVersion: Number,
  challenge: String,
  codeHash: String,
  attempts: { type: Number, default: 0 },
  action: { type: String, enum: ['add', 'remove'] },
  credentialId: String,
  name: String,
  ready: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.models.PasskeyChallenge || mongoose.model('PasskeyChallenge', schema);
