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

export function readSession() {
  const session = readStoredJson("user");
  if (session?.token && session?.user && typeof session.user === "object") return session;
  if (session !== null) localStorage.removeItem("user");
  return null;
}
