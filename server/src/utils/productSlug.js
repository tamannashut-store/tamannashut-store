import mongoose from "mongoose";

export const slugifyProductName = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 120) || "product";

export const productIdentifierFilter = (identifier) => {
  const value = String(identifier || "").trim();
  return mongoose.isValidObjectId(value) ? { _id: value } : { slug: value.toLowerCase() };
};

export const createUniqueProductSlug = async (Product, name, excludeId = null) => {
  const base = slugifyProductName(name);
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    if (!await Product.exists(filter)) return slug;
  }
  throw new Error("A unique product URL could not be generated");
};

export const backfillProductSlugs = async (Product) => {
  const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: "" }] }).select("name slug");
  for (const product of products) {
    product.slug = await createUniqueProductSlug(Product, product.name, product._id);
    await product.save();
  }
  return products.length;
};
