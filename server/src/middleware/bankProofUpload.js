import multer from "multer";
import crypto from "node:crypto";
import { detectImageType } from "./upload.js";
import { encryptSellerValue } from "../utils/sellerOnboarding.js";

export const BANK_PROOF_MAX_BYTES = 3 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
export const encodeBankProof = (file) => {
  if (!file?.buffer?.length) throw Object.assign(new Error("Upload a cancelled cheque, passbook page or bank statement"), { status: 400 });
  const detected = file.buffer.subarray(0, 5).toString("ascii") === "%PDF-" ? "application/pdf" : detectImageType(file.buffer);
  if (file.buffer.length > BANK_PROOF_MAX_BYTES || !allowed.has(detected) || detected !== file.mimetype) {
    throw Object.assign(new Error("Bank proof must be a PDF, JPG or PNG up to 3 MB"), { status: 400 });
  }
  return { encryptedPayload: encryptSellerValue(file.buffer.toString("base64")), mimeType: detected, size: file.buffer.length,
    digest: crypto.createHash("sha256").update(file.buffer).digest("hex"), uploadedAt: new Date() };
};

// Busboy emits partsLimit when the count reaches the limit, including a valid
// application field plus document. Keep file/field limits strict, with headroom
// for the terminating multipart boundary.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: BANK_PROOF_MAX_BYTES, files: 1, fields: 1, fieldSize: 32 * 1024, parts: 3 },
  fileFilter: (_req, file, callback) => callback(allowed.has(file.mimetype) ? null : Object.assign(new Error("Choose a PDF, JPG or PNG bank document"), { status: 400 }), allowed.has(file.mimetype)) });
export const bankProofUpload = (req, res, next) => upload.single("bankProof")(req, res, (error) => {
  if (error) return res.status(400).json({ message: "Choose one PDF, JPG or PNG bank document up to 3 MB" });
  try { req.bankProof = encodeBankProof(req.file); next(); }
  catch (failure) { res.status(failure.status || 503).json({ message: failure.status === 400 ? failure.message : "Secure document storage is unavailable" }); }
});

export const parseSellerApplication = (req, res, next) => {
  try {
    const body = JSON.parse(req.body.application);
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    req.body = body; next();
  } catch { res.status(400).json({ message: "Seller application is invalid" }); }
};
