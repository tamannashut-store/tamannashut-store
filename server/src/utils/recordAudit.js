import AuditLog from "../models/AuditLog.js";

export const recordAudit = async ({ user, action, entityType, entityId, summary = "", metadata = {} }) => {
  try {
    await AuditLog.create({
      actorId: user?._id,
      actorEmail: String(user?.email || "").slice(0, 254),
      action,
      entityType,
      entityId: String(entityId || "").slice(0, 120),
      summary: String(summary || "").slice(0, 500),
      metadata,
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", String(error?.message || "Audit entry failed").slice(0, 200));
  }
};
