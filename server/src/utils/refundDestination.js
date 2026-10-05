import crypto from "crypto";

const invalid = (message) => { throw Object.assign(new Error(message), { status: 400 }); };
export const needsRefundDetails = (order) => order?.status === "Refund Pending" && order.paymentMethod === "COD" && order.paymentStatus === "Paid";
export const normalizeRefundDestination = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid("Enter your refund details");
  const holderName = String(body.holderName || "").trim();
  if (holderName.length < 2 || holderName.length > 120) invalid("Enter the account holder name");
  if (body.method === "UPI") {
    const upiId = String(body.upiId || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,100}@[a-z0-9.-]{2,64}$/.test(upiId)) invalid("Enter a valid UPI ID, such as name@bank");
    return { method: "UPI", holderName, upiId };
  }
  if (body.method === "Bank transfer") {
    const accountNumber = String(body.accountNumber || "").replace(/\s/g, "");
    const confirmation = String(body.confirmAccountNumber || "").replace(/\s/g, "");
    const ifsc = String(body.ifsc || "").trim().toUpperCase();
    if (!/^\d{6,20}$/.test(accountNumber)) invalid("Enter a valid bank account number");
    if (accountNumber !== confirmation) invalid("Bank account numbers do not match");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) invalid("Enter a valid IFSC code");
    return { method: "Bank transfer", holderName, accountNumber, ifsc };
  }
  invalid("Choose UPI or bank transfer");
};
export const maskRefundDestination = (details) => details.method === "UPI"
  ? `${details.upiId.slice(0, 2)}***@${details.upiId.split("@")[1]}`
  : `Account ending ${details.accountNumber.slice(-4)}`;
const key = () => {
  const secret = process.env.REFUND_DATA_ENCRYPTION_KEY || process.env.SELLER_DATA_ENCRYPTION_KEY || "";
  if (secret.length < 32) throw Object.assign(new Error("Secure refund details storage is temporarily unavailable"), { status: 503 });
  return crypto.createHash("sha256").update(`customer-refund:${secret}`).digest();
};
export const encryptRefundDestination = (details) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(details), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
};
export const decryptRefundDestination = (payload) => {
  const [iv, tag, encrypted] = String(payload || "").split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"));
};
