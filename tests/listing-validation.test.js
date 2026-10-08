import test from "node:test";
import assert from "node:assert/strict";
import { validateListing } from "../client/src/utils/listingValidation.js";
import { parseProductFields } from "../server/src/utils/productFields.js";

const form = { name: "Notebook", category: "books-stationery", price: 100, mrp: 120, baseSku: "NOTEBOOK", hsnCode: "4820", description: "Ruled notebook", productType: "simple", gstMode: "custom", gstRate: 0, status: "active" };
const variants = [{ sku: "NOTEBOOK-1", size: "Standard", stock: 4, price: 100, active: true }];

test("confirmed zero GST is accepted by both listing validation and server parsing", () => {
  assert.deepEqual(validateListing(form, variants, 1), { fields: {}, inventory: [], photos: [] });
  assert.equal(parseProductFields({ ...form, variants }).gstRate, 0);
});

test("publishing catches missing tax confirmation and misleading MRP", () => {
  const result = validateListing({ ...form, gstRate: "", mrp: 90 }, variants, 1);
  assert.ok(result.fields.gstRate);
  assert.ok(result.fields.mrp);
});

test("inventory validation catches duplicate SKUs, inactive inventory and fractional stock", () => {
  const result = validateListing({ ...form, productType: "variable" }, [{ ...variants[0], active: false }, { ...variants[0], stock: 1.5, active: false }], 1);
  assert.ok(result.inventory.some(message => message.includes("active")));
  assert.ok(result.inventory.some(message => message.includes("duplicated")));
  assert.ok(result.inventory.some(message => message.includes("whole number")));
});

test("a name-only private draft does not require publishing details", () => {
  assert.deepEqual(validateListing({ name: "Work in progress", status: "draft", price: "", mrp: "" }), { fields: {}, inventory: [], photos: [] });
});
