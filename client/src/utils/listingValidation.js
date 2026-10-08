const blank = (value) => !String(value ?? "").trim();

export function validateListing(form, variants = [], imageCount = 0) {
  const fields = {};
  const draft = form.status === "draft";
  const category = String(form.category || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const apparel = ["girls", "boys", "clothing", "fashion", "new-arrivals"].includes(category);
  if (blank(form.name) || String(form.name).trim().length > 200) fields.name = "Enter a product name of 200 characters or fewer.";
  if ((!draft && blank(form.price)) || !Number.isFinite(Number(form.price)) || Number(form.price) < 0 || (!draft && Number(form.price) <= 0)) fields.price = "Enter a selling price greater than zero.";
  const mrp = blank(form.mrp) && draft ? Number(form.price || 0) : Number(form.mrp);
  if ((!draft && blank(form.mrp)) || !Number.isFinite(mrp) || mrp < Number(form.price || 0)) fields.mrp = "MRP must be equal to or greater than the selling price.";
  if (!draft && blank(form.baseSku)) fields.baseSku = "Enter a base SKU to identify this product.";
  if (!draft && !category) fields.category = "Choose or enter a category.";
  if ((!draft || !blank(form.hsnCode)) && !/^\d{4,8}$/.test(String(form.hsnCode || "").replace(/\s/g, ""))) fields.hsnCode = "Enter the product’s 4–8 digit HSN code.";
  if (!draft && blank(form.description)) fields.description = "Add a description customers can use to understand the product.";
  const customTax = form.gstMode === "custom" || (!form.gstMode && !apparel);
  if ((customTax && !draft && blank(form.gstRate)) || (!blank(form.gstRate) && (!Number.isFinite(Number(form.gstRate)) || Number(form.gstRate) < 0 || Number(form.gstRate) > 100))) fields.gstRate = "Confirm a GST percentage from 0 to 100, including 0 for exempt products.";
  for (const key of ["weightKg", "lengthCm", "widthCm", "heightCm"]) if (!blank(form[key]) && (!Number.isFinite(Number(form[key])) || Number(form[key]) <= 0)) fields[key] = "Enter a positive packed measurement, or leave this optional field blank.";
  const inventory = [];
  if (!draft && !variants.some((item) => item.active !== false)) inventory.push("Add at least one active inventory option.");
  if (form.productType === "simple" && variants.length > 1) inventory.push("A single SKU product must have only one inventory row.");
  const skus = new Set();
  const options = new Set();
  variants.forEach((item, index) => {
    const label = `Inventory row ${index + 1}`;
    const sku = String(item.sku || "").trim().toUpperCase();
    const size = String(item.size || (form.productType === "simple" ? "Standard" : "")).trim();
    const price = blank(item.price) ? Number(form.price || 0) : Number(item.price);
    if (!sku || !size) inventory.push(`${label}: enter both an option and SKU.`);
    if (!Number.isInteger(Number(item.stock)) || Number(item.stock) < 0) inventory.push(`${label}: stock must be a non-negative whole number.`);
    if (!Number.isFinite(price) || price < 0 || (!draft && price <= 0) || price > mrp) inventory.push(`${label}: price must be ${draft ? "non-negative" : "greater than zero"} and at or below MRP.`);
    if (sku && skus.has(sku)) inventory.push(`${label}: SKU ${sku} is duplicated.`);
    skus.add(sku);
    const option = `${String(item.color || "").trim().toLowerCase()}|${size.toLowerCase()}`;
    if (options.has(option)) inventory.push(`${label}: this style and option combination is duplicated.`);
    options.add(option);
  });
  return { fields, inventory, photos: !draft && !imageCount ? ["Upload at least one product photo."] : [] };
}
