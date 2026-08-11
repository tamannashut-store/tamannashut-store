export const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fuzzyTokenPattern = (token) => {
  const escaped = escapeRegex(token);
  if (token.length < 3) return escaped;

  const variants = new Set([escaped]);
  for (let index = 0; index < token.length; index += 1) {
    variants.add(`${escapeRegex(token.slice(0, index))}.${escapeRegex(token.slice(index + 1))}`);
    variants.add(`${escapeRegex(token.slice(0, index))}${escapeRegex(token.slice(index + 1))}`);
  }
  for (let index = 1; index < token.length; index += 1) {
    variants.add(`${escapeRegex(token.slice(0, index))}.${escapeRegex(token.slice(index))}`);
  }
  return `(?:${[...variants].join("|")})`;
};

export const buildSearchRegex = (value, { fuzzy = false } = {}) => {
  const normalized = String(value || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!fuzzy) return new RegExp(escapeRegex(normalized), "i");
  const tokens = normalized.toLowerCase().match(/[a-z0-9]+/g) || [];
  if (!tokens.length) return new RegExp(escapeRegex(normalized), "i");
  return new RegExp(tokens.map(fuzzyTokenPattern).join(".*"), "i");
};
