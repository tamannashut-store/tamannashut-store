import { inventoryItems } from "./inventory.js";

const SITE_URL = "https://www.tamannashut.com";

export const xmlText = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const variantKey = (variant, index) => String(variant?.sku || `${variant?.color || "variant"}-${variant?.size || index}`)
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 25) || String(index + 1);

export const merchantVariantId = (product, variant, index) => `${String(product._id)}:${variantKey(variant, index)}`.slice(0, 50);

const same = (left, right) => String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();

export const merchantVariantImages = (product, variant) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  const colorImages = variant?.color ? images.filter((image) => same(image.color, variant.color)) : [];
  const exact = colorImages.filter((image) => image.size && same(image.size, variant.size));
  const colorShared = colorImages.filter((image) => !String(image.size || "").trim());
  const shared = images.filter((image) => !String(image.color || "").trim());
  const ordered = [...exact, ...colorShared, ...colorImages, ...shared, ...images];
  return [...new Map(ordered.filter((image) => image?.url).map((image) => [image.url, image])).values()];
};

export const merchantGender = (product) => {
  const category = String(product?.category || "").toLowerCase();
  if (category.includes("girl")) return "female";
  if (category.includes("boy")) return "male";
  return "unisex";
};

export const merchantAgeGroup = (product, variant) => {
  const value = `${variant?.size || ""} ${product?.ageGroup || ""}`.toLowerCase();
  if (/\b\d+\s*-\s*\d+\s*m\b|month/.test(value)) return "infant";
  if (/\b[0-4]\s*-\s*[1-4]\s*(?:y|year)/.test(value)) return "toddler";
  return "kids";
};

const productVariants = (product) => {
  const rows = inventoryItems(product);
  if (rows.length) return rows;
  return [{ sku: product.baseSku || "", size: "", color: product.color || "", stock: 0, price: product.price }];
};

export const googleMerchantItems = (product) => productVariants(product).map((variant, index) => {
  const images = merchantVariantImages(product, variant);
  const color = String(variant.color || product.color || "").trim();
  const size = String(variant.size || "").trim();
  const params = new URLSearchParams();
  if (color) params.set("color", color);
  if (size) params.set("size", size);
  const suffix = params.size ? `?${params.toString()}` : "";
  return {
    id: merchantVariantId(product, variant, index),
    groupId: String(product._id),
    title: [product.name, color, size].filter(Boolean).join(" - "),
    description: product.description || product.name,
    link: `${SITE_URL}/product/${encodeURIComponent(String(product.slug || product._id))}${suffix}`,
    image: images[0]?.url || "",
    additionalImages: images.slice(1, 11).map((image) => image.url),
    availability: Number(variant.stock || 0) > 0 ? "in_stock" : "out_of_stock",
    price: Number(variant.price ?? product.price ?? 0),
    color,
    size,
    gender: merchantGender(product),
    ageGroup: merchantAgeGroup(product, variant),
  };
});

const element = (name, value) => value === "" || value == null ? "" : `<${name}>${xmlText(value)}</${name}>`;

export const buildGoogleMerchantFeed = (products) => {
  const items = products.flatMap(googleMerchantItems).map((item) => `
<item>
${element("g:id", item.id)}
${element("g:item_group_id", item.groupId)}
${element("g:title", item.title)}
${element("g:description", item.description)}
${element("g:link", item.link)}
${element("g:image_link", item.image)}
${item.additionalImages.map((url) => element("g:additional_image_link", url)).join("\n")}
${element("g:availability", item.availability)}
<g:condition>new</g:condition>
${element("g:price", `${item.price.toFixed(2)} INR`)}
<g:brand>Tamanna&apos;s Hut</g:brand>
<g:identifier_exists>false</g:identifier_exists>
${element("g:color", item.color)}
${element("g:size", item.size)}
${element("g:gender", item.gender)}
${element("g:age_group", item.ageGroup)}
<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>0 INR</g:price></g:shipping>
<g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
</item>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Tamanna&apos;s Hut</title>
<link>${SITE_URL}</link>
<description>Kids Fashion Store</description>${items}
</channel>
</rss>`;
};
