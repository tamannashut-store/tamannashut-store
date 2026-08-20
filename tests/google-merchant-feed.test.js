import test from "node:test";
import assert from "node:assert/strict";
import { buildGoogleMerchantFeed, googleMerchantItems, merchantVariantImages } from "../server/src/utils/googleMerchantFeed.js";

const product = {
  _id: "507f1f77bcf86cd799439011",
  slug: "baby-cotton-set",
  name: "Baby Cotton & Bow Set",
  description: "Soft <cotton> clothing",
  price: 299,
  category: "girls",
  ageGroup: "0-48 Months",
  images: [
    { url: "https://images.example/orange.jpg", color: "Orange", size: "" },
    { url: "https://images.example/maroon.jpg", color: "Maroon", size: "" },
    { url: "https://images.example/shared.jpg", color: "", size: "" },
  ],
  variants: [
    { sku: "TH-ORG-03", color: "Orange", size: "0-3M", price: 299, stock: 2, active: true },
    { sku: "TH-MAR-912", color: "Maroon", size: "9-12M", price: 319, stock: 0, active: true },
    { sku: "TH-HIDDEN", color: "Green", size: "3-6M", price: 250, stock: 5, active: false },
  ],
};

test("Merchant feed creates one grouped item for every active colour and size", () => {
  const items = googleMerchantItems(product);
  assert.equal(items.length, 2);
  assert.equal(items[0].groupId, product._id);
  assert.equal(items[0].image, "https://images.example/orange.jpg");
  assert.equal(items[0].availability, "in_stock");
  assert.equal(items[0].link, "https://www.tamannashut.com/product/baby-cotton-set?color=Orange&size=0-3M");
  assert.equal(items[1].image, "https://images.example/maroon.jpg");
  assert.equal(items[1].availability, "out_of_stock");
  assert.equal(items[1].price, 319);
  assert.equal(items[1].gender, "female");
  assert.equal(items[1].ageGroup, "infant");
});

test("variant image selection prioritizes exact colour and size", () => {
  const images = merchantVariantImages({ ...product, images: [{ url: "shared", color: "" }, { url: "colour", color: "Orange" }, { url: "exact", color: "Orange", size: "0-3M" }] }, product.variants[0]);
  assert.deepEqual(images.map((image) => image.url), ["exact", "colour", "shared"]);
});

test("Merchant XML escapes catalogue data and includes apparel variant fields", () => {
  const xml = buildGoogleMerchantFeed([product]);
  assert.match(xml, /<g:item_group_id>507f1f77bcf86cd799439011<\/g:item_group_id>/);
  assert.match(xml, /Baby Cotton &amp; Bow Set - Orange - 0-3M/);
  assert.match(xml, /Soft &lt;cotton&gt; clothing/);
  assert.match(xml, /<g:color>Maroon<\/g:color>/);
  assert.match(xml, /<g:size>9-12M<\/g:size>/);
  assert.doesNotMatch(xml, /TH-HIDDEN/);
  assert.equal((xml.match(/<item>/g) || []).length, 2);
});

test("legacy size inventory remains eligible for the feed", () => {
  const [item] = googleMerchantItems({ ...product, variants: [], sizeStock: [{ size: "2-3Y", stock: 4 }], color: "Blue" });
  assert.equal(item.size, "2-3Y");
  assert.equal(item.color, "Blue");
  assert.equal(item.availability, "in_stock");
});
