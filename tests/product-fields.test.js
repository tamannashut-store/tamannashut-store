import test from "node:test";
import assert from "node:assert/strict";
import { parseProductFields, assertPublishable } from "../server/src/utils/productFields.js";
import { gstRateForProduct, calculateApparelGst } from "../server/src/utils/gst.js";
import { buildGoogleMerchantFeed } from "../server/src/utils/googleMerchantFeed.js";

const bottle = {
  name: "Steel bottle", category: "Home & Kitchen", price: "500", mrp: "700", hsnCode: "7323",
  description: "Reusable steel bottle", productType: "simple", gstMode: "custom", gstRate: "18",
  variants: JSON.stringify([{ sku: "BOTTLE-001", size: "Standard", stock: 5, price: 500 }]),
  tags: "[]", weightKg: "0.4", lengthCm: "10", widthCm: "10", heightCm: "25",
  brand: "Example", specifications: "Capacity: 1 litre", images: [{ url: "https://example.com/bottle.jpg", public_id: "bottle" }],
};

test("general category supports a single SKU without a colour and preserves fulfilment fields", () => {
  const product = parseProductFields(bottle);
  assert.equal(product.category, "home-kitchen");
  assert.equal(product.gstRate, 18);
  assert.equal(product.weightKg, 0.4);
  assert.equal(product.specifications, "Capacity: 1 litre");
  assert.equal(product.variants[0].color, "");
  assertPublishable({ ...product, images: bottle.images });
});

test("incomplete private draft can be saved but cannot be activated", () => {
  const product = parseProductFields({ name: "Work in progress", status: "draft" });
  assert.equal(product.variants.length, 0);
  assert.throws(() => assertPublishable(product), { status: 400 });
});

test("invalid JSON and non-array fields are client errors", () => {
  for (const field of ["variants", "tags", "sizeStock"]) {
    assert.throws(() => parseProductFields({ ...bottle, [field]: "{" }), { status: 400 });
    assert.throws(() => parseProductFields({ ...bottle, [field]: "{}" }), { status: 400 });
  }
});

test("non-apparel publication requires a confirmed product tax rate", () => {
  assert.throws(() => parseProductFields({ ...bottle, gstRate: "" }), { status: 400 });
  assert.throws(() => parseProductFields({ ...bottle, gstMode: "apparel" }), { status: 400 });
  assert.equal(parseProductFields({ ...bottle, gstRate: "0" }).gstRate, 0);
  assert.throws(() => gstRateForProduct({ gstMode: "custom" }, 500), { status: 409 });
});

test("legacy apparel retains value-dependent tax calculation", () => {
  assert.equal(gstRateForProduct({}, 299), 5);
  assert.equal(gstRateForProduct({ gstMode: "apparel" }, 3000), 18);
});

test("invoice honours fixed and exempt tax snapshots", () => {
  const invoice = calculateApparelGst({ products: [{ price: 112, qty: 1, gstRate: 12 }, { price: 100, qty: 1, gstRate: 0 }], state: "West Bengal" });
  assert.deepEqual(invoice.lines.map((line) => line.rate), [12, 0]);
  assert.ok(Math.abs(invoice.tax - 12) < 0.00001);
});

test("duplicate option combinations and misleading variant prices are rejected", () => {
  const first = { sku: "A", size: "1 litre", price: 500, stock: 1 };
  assert.throws(() => parseProductFields({ ...bottle, productType: "variable", variants: JSON.stringify([first, { ...first, sku: "B" }]) }), { status: 400 });
  assert.throws(() => parseProductFields({ ...bottle, variants: JSON.stringify([{ ...first, price: 800 }]) }), { status: 400 });
  assert.throws(() => parseProductFields({ ...bottle, variants: JSON.stringify([{ ...first, stock: 1.5 }]) }), { status: 400 });
});

test("inactive options do not inflate publicly available stock", () => {
  const product = parseProductFields({ ...bottle, productType: "variable", variants: JSON.stringify([{ sku: "A", size: "1 litre", stock: 5, price: 500 }, { sku: "B", size: "2 litres", stock: 20, price: 600, active: false }]) });
  assert.deepEqual(product.sizeStock, [{ size: "1 litre", stock: 5 }]);
});

test("merchant feed does not describe non-apparel as children's clothing", () => {
  const product = { ...parseProductFields(bottle), _id: "bottle", images: bottle.images };
  const feed = buildGoogleMerchantFeed([product]);
  assert.match(feed, /<g:brand>Example<\/g:brand>/);
  assert.doesNotMatch(feed, /<g:age_group>|<g:gender>|Apparel/);
});
