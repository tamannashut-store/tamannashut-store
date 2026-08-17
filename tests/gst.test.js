import test from "node:test";
import assert from "node:assert/strict";
import { calculateApparelGst, gstRateForApparelUnit } from "../server/src/utils/gst.js";

test("apparel uses 5 percent GST through Rs 2500 per piece and 18 percent above", () => {
  assert.equal(gstRateForApparelUnit(299), 5);
  assert.equal(gstRateForApparelUnit(2500), 5);
  assert.equal(gstRateForApparelUnit(2500.01), 18);
});

test("West Bengal orders split tax into CGST and SGST", () => {
  const result = calculateApparelGst({ state: "West Bengal", subtotal: 299, totalAmount: 299, products: [{ price: 299, qty: 1 }] });
  assert.equal(result.intraState, true);
  assert.equal(result.lines[0].rate, 5);
  assert.ok(Math.abs(result.taxable + result.cgst + result.sgst - 299) < 0.001);
  assert.equal(result.igst, 0);
});

test("interstate orders use IGST and allocate order discounts proportionately", () => {
  const result = calculateApparelGst({ state: "Maharashtra", subtotal: 3000, discount: 300, totalAmount: 2700, products: [{ price: 3000, qty: 1 }] });
  assert.equal(result.intraState, false);
  assert.equal(result.lines[0].rate, 18);
  assert.equal(result.cgst, 0);
  assert.ok(Math.abs(result.taxable + result.igst - 2700) < 0.001);
});

test("a discount can move per-piece transaction value into the 5 percent apparel slab", () => {
  const result = calculateApparelGst({ state: "West Bengal", subtotal: 2600, discount: 200, totalAmount: 2400, products: [{ price: 2600, qty: 1 }] });
  assert.equal(result.lines[0].rate, 5);
});

test("historical orders retain their stored GST rate", () => {
  const result = calculateApparelGst({ state: "West Bengal", subtotal: 2600, totalAmount: 2600, products: [{ price: 2600, qty: 1, gstRate: 5 }] });
  assert.equal(result.lines[0].rate, 5);
});
