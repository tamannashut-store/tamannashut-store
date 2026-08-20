const commonPasswords = new Set([
  "password", "password1", "password123", "12345678", "123456789", "qwerty123", "admin123", "welcome123",
]);

export const passwordPolicyError = (password) => {
  const value = String(password || "");
  if (value.length < 8 || value.length > 128) return "Password must be between 8 and 128 characters";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return "Password must include at least one letter and one number";
  if (commonPasswords.has(value.toLowerCase())) return "Choose a less common password";
  return "";
};
