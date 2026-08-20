import crypto from "crypto";

export const hashAuthSecret = (value) => crypto.createHash("sha256").update(String(value || "")).digest("hex");

export const createEmailVerification = (now = Date.now()) => {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashAuthSecret(token), expiresAt: new Date(now + 24 * 60 * 60 * 1000) };
};

export const createTwoFactorCode = (now = Date.now()) => {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { code, codeHash: hashAuthSecret(code), expiresAt: new Date(now + 10 * 60 * 1000) };
};

export const maskEmail = (email) => {
  const [name = "", domain = ""] = String(email || "").split("@");
  if (!domain) return "your email";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
};

export const safeSecretEqual = (left, right) => {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
