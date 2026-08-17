export function readStoredJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function readStoredArray(key) {
  const value = readStoredJson(key, []);
  if (Array.isArray(value)) return value;
  localStorage.removeItem(key);
  return [];
}

export function isExpiredJwt(token, now = Date.now()) {
  if (typeof token !== "string" || token.split(".").length !== 3) return false;
  try {
    const encoded = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(encoded));
    return Number.isFinite(Number(payload.exp)) && Number(payload.exp) * 1000 <= now;
  } catch {
    // Opaque or malformed tokens are left for the server to validate.
    return false;
  }
}

export function readSession() {
  const session = readStoredJson("user");
  if (session?.token && session?.user && typeof session.user === "object" && !isExpiredJwt(session.token)) return session;
  if (session !== null) localStorage.removeItem("user");
  return null;
}
