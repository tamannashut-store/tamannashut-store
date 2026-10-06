const invalid = (message) => { throw Object.assign(new Error(message), { status: 400 }); };
const text = (value, limit = 120) => String(value ?? "").trim().slice(0, limit);
const list = (value, name, limit) => {
  let parsed;
  try { parsed = typeof value === "string" ? JSON.parse(value || "[]") : value ?? []; } catch { invalid(`Invalid ${name}`); }
  if (!Array.isArray(parsed) || parsed.length > limit) invalid(`Invalid ${name}; maximum ${limit} entries`);
  return parsed;
};
export const legacyApparelCategory = (category) => ["girls", "boys", "new-arrivals", "clothing", "fashion"].includes(category);

export function parseProductFields(body) {
  const status = ["draft", "active", "archived"].includes(body.status) ? body.status : "active";
  const draft = status === "draft";
  const name = text(body.name, 201);
  if (!name || name.length > 200) invalid("Product name is required and must be under 200 characters");
  const price = Number(body.price || 0);
  const mrp = Number(body.mrp || price);
  if (!Number.isFinite(price) || price < 0 || (!draft && price <= 0)) invalid("Enter a valid selling price greater than zero to publish");
  if (!Number.isFinite(mrp) || mrp < price) invalid("MRP must be equal to or greater than the selling price");
  const category = text(body.category, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!draft && !category) invalid("Enter a product category");
  const hsnCode = text(body.hsnCode, 9).replace(/\s/g, "");
  if ((hsnCode || !draft) && !/^\d{4,8}$/.test(hsnCode)) invalid("Enter the correct 4 to 8 digit HSN code for this product");
  const gstMode = body.gstMode || (legacyApparelCategory(category) ? "apparel" : "custom");
  if (!["apparel", "custom"].includes(gstMode)) invalid("Select a valid tax calculation");
  if (gstMode === "apparel" && !legacyApparelCategory(category)) invalid("Use a confirmed GST rate for this product category");
  const gstRate = body.gstRate === "" || body.gstRate == null ? null : Number(body.gstRate);
  if (gstRate != null && (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100)) invalid("Enter a valid GST percentage between 0 and 100");
  if (!draft && gstMode === "custom" && gstRate == null) invalid("Confirm the GST percentage before publishing this product");
  const baseSku = text(body.baseSku, 60).toUpperCase();
  const color = text(body.color, 80);
  const productType = body.productType || "variable";
  if (!["simple", "variable"].includes(productType)) invalid("Select single SKU or product options");
  const sizeStock = list(body.sizeStock, "inventory", 100);
  const submitted = list(body.variants, "variants", 100);
  const variants = (submitted.length ? submitted : sizeStock.map((item) => ({ ...item, sku: `${baseSku || name.replace(/[^a-z0-9]/gi, "-")}-${item.size}`, color, price }))).map((entry) => {
    if (!entry || typeof entry !== "object") invalid("Invalid product variant");
    const sku = text(entry.sku, 80).toUpperCase();
    const size = text(entry.size || (productType === "simple" ? "Standard" : ""), 30);
    const stock = Number(entry.stock);
    const variantPrice = entry.price === "" || entry.price == null ? price : Number(entry.price);
    if (!sku || !size || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(variantPrice) || variantPrice < 0 || (!draft && variantPrice <= 0)) invalid("Every SKU needs an option, valid price and non-negative whole stock quantity");
    if (variantPrice > mrp) invalid("Every variant selling price must be at or below MRP");
    return { sku, size, color: text(entry.color ?? color, 80), stock, price: variantPrice, active: entry.active !== false };
  });
  if (new Set(variants.map((entry) => entry.sku)).size !== variants.length) invalid("Variant SKUs must be unique within a product");
  if (new Set(variants.map((entry) => `${entry.color.toLowerCase()}|${entry.size.toLowerCase()}`)).size !== variants.length) invalid("Each style and option combination must be unique");
  if (productType === "simple" && variants.length > 1) invalid("A single SKU product can have only one inventory row");
  if (!draft && !variants.some((entry) => entry.active)) invalid("Add at least one active product SKU before publishing");
  const stockBySize = new Map();
  variants.filter((entry) => entry.active).forEach((entry) => stockBySize.set(entry.size, (stockBySize.get(entry.size) || 0) + entry.stock));
  const lowStockThreshold = Number(body.lowStockThreshold ?? 3);
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) invalid("Low-stock alert must be a non-negative whole number");
  const livePrices = variants.filter((entry) => entry.active).map((entry) => entry.price);
  const fields = { name, price: livePrices.length ? Math.min(...livePrices) : price, mrp, category, hsnCode, baseSku, color: color || variants[0]?.color || "", status, gstMode, gstRate, productType, lowStockThreshold, variants, sizeStock: [...stockBySize].map(([size, stock]) => ({ size, stock })) };
  for (const key of ["brand", "modelNumber", "manufacturer", "countryOfOrigin", "subcategory", "fabric", "ageGroup", "warranty", "packageContents"]) fields[key] = text(body[key], key === "packageContents" ? 500 : 120);
  fields.description = text(body.description, 5000);
  fields.specifications = text(body.specifications, 3000);
  fields.optionLabel = text(body.optionLabel || "Size", 30);
  fields.tags = list(body.tags, "tags", 20).map((tag) => text(tag, 60).toLowerCase()).filter(Boolean);
  for (const key of ["weightKg", "lengthCm", "widthCm", "heightCm"]) {
    fields[key] = body[key] === "" || body[key] == null ? null : Number(body[key]);
    if (fields[key] != null && (!Number.isFinite(fields[key]) || fields[key] <= 0 || fields[key] > 10000)) invalid("Package weight and dimensions must be positive numbers");
  }
  return fields;
}

export function assertPublishable(product) {
  parseProductFields({ ...product, status: "active", tags: product.tags || [], variants: product.variants || [], sizeStock: product.sizeStock || [] });
  if (!product.description?.trim()) invalid("Add a product description before publishing");
  if (!product.images?.length) invalid("Add at least one product image before publishing");
}
