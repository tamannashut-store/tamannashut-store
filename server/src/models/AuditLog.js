import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  actorEmail: { type: String, default: "", trim: true, maxlength: 254 },
  action: { type: String, required: true, trim: true, maxlength: 100, index: true },
  entityType: { type: String, required: true, trim: true, maxlength: 60, index: true },
  entityId: { type: String, default: "", trim: true, maxlength: 120, index: true },
  summary: { type: String, default: "", trim: true, maxlength: 500 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 86400000), index: { expires: 0 } },
}, { timestamps: true, versionKey: false });

auditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
