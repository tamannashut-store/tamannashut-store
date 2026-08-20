export const normalizeIndianPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return "";
};

export const phoneLookupValues = (normalizedPhone) => {
  const normalized = normalizeIndianPhone(normalizedPhone);
  if (!normalized) return [];
  const local = normalized.slice(3);
  return [normalized, normalized.slice(1), local];
};
