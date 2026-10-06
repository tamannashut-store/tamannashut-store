const limitedExactRoutes = new Set([
  "POST /login",
  "POST /admin-login",
  "POST /register",
  "POST /forgot-password",
  "POST /verify-email",
  "POST /verify-email/resend",
  "POST /admin-login/verify",
  "POST /admin-login/resend",
  "POST /phone-verification/send",
  "POST /phone-verification/check",
  "POST /phone-login/send",
  "POST /phone-login/check",
  "POST /customer-otp/send",
  "POST /customer-otp/check",
  "POST /delete-otp/send",
  "POST /delete-otp/check",
  "POST /seller-applications",
  "POST /seller-application/email/send",
  "POST /seller-application/email/check",
]);

export function isRateLimitedAuthRequest(method, path) {
  const normalizedMethod = String(method || "").toUpperCase();
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "").split("?")[0]}`;
  if (limitedExactRoutes.has(`${normalizedMethod} ${normalizedPath}`)) return true;
  if (normalizedMethod === "POST" && /^\/reset-password\/[^/]+$/.test(normalizedPath)) return true;
  if (normalizedMethod === "POST" && /^\/seller-invitations\/[^/]+\/accept$/.test(normalizedPath)) return true;
  if (normalizedMethod === "GET" && /^\/seller-invitations\/[^/]+$/.test(normalizedPath)) return true;
  return false;
}
