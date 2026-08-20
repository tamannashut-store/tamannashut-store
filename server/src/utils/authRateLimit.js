const limitedExactRoutes = new Set([
  "POST /login",
  "POST /admin-login",
  "POST /register",
  "POST /forgot-password",
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
