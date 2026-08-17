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
  const tradeName = String(body.tradeName || "").trim().slice(0, 120);
  const businessType = String(body.businessType || "").trim();
  const businessPhone = String(body.businessPhone || "").replace(/\s/g, "");
  const authorizedSignatoryName = String(body.authorizedSignatoryName || "").trim().slice(0, 120);
  const gstin = String(body.gstin || "").trim().toUpperCase().replace(/\s/g, "");
  const pan = String(body.pan || "").trim().toUpperCase().replace(/\s/g, "");
  const bankAccountHolder = String(body.bankAccountHolder || "").trim().slice(0, 120);
  const bankAccountNumber = String(body.bankAccountNumber || "").replace(/\s/g, "");
  const ifsc = String(body.ifsc || "").trim().toUpperCase().replace(/\s/g, "");
  const bankAccountType = String(body.bankAccountType || "").trim().toLowerCase();
  const address = (prefix) => ({
    line1: String(body[`${prefix}Line1`] || "").trim().slice(0, 200),
    line2: String(body[`${prefix}Line2`] || "").trim().slice(0, 200),
    city: String(body[`${prefix}City`] || "").trim().slice(0, 100),
    state: String(body[`${prefix}State`] || "").trim().slice(0, 100),
    pincode: String(body[`${prefix}Pincode`] || "").replace(/\D/g, ""),
  });
  const registeredAddress = address("registeredAddress");
  const pickupAddress = body.pickupSameAsRegistered === true || body.pickupSameAsRegistered === "true"
    ? { ...registeredAddress }
    : address("pickupAddress");
  if (legalBusinessName.length < 2) throw Object.assign(new Error("Enter the legal business name"), { status: 400 });
  if (tradeName.length < 2) throw Object.assign(new Error("Enter the customer-facing trade name"), { status: 400 });
  if (!["proprietorship", "partnership", "llp", "private_limited", "public_limited", "trust", "society", "other"].includes(businessType)) throw Object.assign(new Error("Select the legal business type"), { status: 400 });
  if (!/^\+?[0-9]{10,13}$/.test(businessPhone)) throw Object.assign(new Error("Enter a valid business phone number"), { status: 400 });
  if (authorizedSignatoryName.length < 2) throw Object.assign(new Error("Enter the authorised signatory name"), { status: 400 });
  if (!gstinPattern.test(gstin)) throw Object.assign(new Error("Enter a valid 15-character GSTIN"), { status: 400 });
  if (!panPattern.test(pan)) throw Object.assign(new Error("Enter a valid PAN"), { status: 400 });
  if (gstin.slice(2, 12) !== pan) throw Object.assign(new Error("The PAN must match the PAN embedded in the GSTIN"), { status: 400 });
  if (bankAccountHolder.length < 2) throw Object.assign(new Error("Enter the bank account holder name"), { status: 400 });
  if (!/^[0-9]{6,20}$/.test(bankAccountNumber)) throw Object.assign(new Error("Enter a valid bank account number"), { status: 400 });
  if (String(body.confirmBankAccountNumber || "").replace(/\s/g, "") !== bankAccountNumber) throw Object.assign(new Error("Bank account numbers do not match"), { status: 400 });
  if (!ifscPattern.test(ifsc)) throw Object.assign(new Error("Enter a valid 11-character IFSC"), { status: 400 });
  if (!["current", "savings"].includes(bankAccountType)) throw Object.assign(new Error("Select the bank account type"), { status: 400 });
  for (const [label, value] of [["registered", registeredAddress], ["pickup", pickupAddress]]) {
    if (value.line1.length < 5 || value.city.length < 2 || value.state.length < 2 || !/^\d{6}$/.test(value.pincode)) {
      throw Object.assign(new Error(`Enter a complete ${label} business address`), { status: 400 });
    }
  }
  if (body.gstDeclaration !== true) throw Object.assign(new Error("Confirm that the GST registration is active and the business details match the GST certificate"), { status: 400 });
  if (body.bankDeclaration !== true) throw Object.assign(new Error("Confirm that the settlement account belongs to this business or proprietor"), { status: 400 });
  if (body.termsAccepted !== true) throw Object.assign(new Error("Accept the seller terms and data-processing consent"), { status: 400 });
  return { legalBusinessName, tradeName, businessType, businessPhone, authorizedSignatoryName, registeredAddress, pickupAddress, gstin, pan, bankAccountHolder, bankAccountNumber, bankAccountType, ifsc };
};

export const encryptedSellerProfile = (details) => ({
  legalBusinessName: details.legalBusinessName,
  tradeName: details.tradeName,
  businessType: details.businessType,
  businessPhone: details.businessPhone,
  authorizedSignatoryName: details.authorizedSignatoryName,
  registeredAddress: details.registeredAddress,
  pickupAddress: details.pickupAddress,
  gstinEncrypted: encryptSellerValue(details.gstin),
  gstinLast4: details.gstin.slice(-4),
  panEncrypted: encryptSellerValue(details.pan),
  panLast4: details.pan.slice(-4),
  bankAccountHolder: details.bankAccountHolder,
  bankAccountType: details.bankAccountType,
  bankAccountEncrypted: encryptSellerValue(details.bankAccountNumber),
  bankAccountLast4: details.bankAccountNumber.slice(-4),
  ifscEncrypted: encryptSellerValue(details.ifsc),
  ifscLast4: details.ifsc.slice(-4),
  gstVerification: { status: "format_checked", source: "applicant_declaration", checkedAt: new Date() },
  bankVerification: { status: "format_checked", source: "manual_document_review", checkedAt: new Date() },
  declarationsAcceptedAt: new Date(),
});
