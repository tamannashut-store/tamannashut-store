import crypto from "crypto";

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const encryptionKey = () => {
  const secret = String(process.env.SELLER_DATA_ENCRYPTION_KEY || "");
  if (secret.length < 32) throw Object.assign(new Error("Seller onboarding encryption is not configured"), { status: 503 });
  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptSellerValue = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
};

export const decryptSellerValue = (payload) => {
  const [iv, tag, encrypted] = String(payload || "").split(".");
  if (!iv || !tag || !encrypted) throw new Error("Encrypted seller data is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
};

export const normalizeSellerDetails = (body) => {
  const legalBusinessName = String(body.legalBusinessName || "").trim().slice(0, 120);
  const gstin = String(body.gstin || "").trim().toUpperCase().replace(/\s/g, "");
  const pan = String(body.pan || "").trim().toUpperCase().replace(/\s/g, "");
  const bankAccountHolder = String(body.bankAccountHolder || "").trim().slice(0, 120);
  const bankAccountNumber = String(body.bankAccountNumber || "").replace(/\s/g, "");
  const ifsc = String(body.ifsc || "").trim().toUpperCase().replace(/\s/g, "");
  if (legalBusinessName.length < 2) throw Object.assign(new Error("Enter the legal business name"), { status: 400 });
  if (!gstinPattern.test(gstin)) throw Object.assign(new Error("Enter a valid 15-character GSTIN"), { status: 400 });
  if (!panPattern.test(pan)) throw Object.assign(new Error("Enter a valid PAN"), { status: 400 });
  if (gstin.slice(2, 12) !== pan) throw Object.assign(new Error("The PAN must match the PAN embedded in the GSTIN"), { status: 400 });
  if (bankAccountHolder.length < 2) throw Object.assign(new Error("Enter the bank account holder name"), { status: 400 });
  if (!/^[0-9]{6,20}$/.test(bankAccountNumber)) throw Object.assign(new Error("Enter a valid bank account number"), { status: 400 });
  if (!ifscPattern.test(ifsc)) throw Object.assign(new Error("Enter a valid 11-character IFSC"), { status: 400 });
  return { legalBusinessName, gstin, pan, bankAccountHolder, bankAccountNumber, ifsc };
};

export const encryptedSellerProfile = (details) => ({
  legalBusinessName: details.legalBusinessName,
  gstinEncrypted: encryptSellerValue(details.gstin),
  gstinLast4: details.gstin.slice(-4),
  panEncrypted: encryptSellerValue(details.pan),
  panLast4: details.pan.slice(-4),
  bankAccountHolder: details.bankAccountHolder,
  bankAccountEncrypted: encryptSellerValue(details.bankAccountNumber),
  bankAccountLast4: details.bankAccountNumber.slice(-4),
  ifscEncrypted: encryptSellerValue(details.ifsc),
  ifscLast4: details.ifsc.slice(-4),
});
