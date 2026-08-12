import assert from "node:assert/strict";
import test from "node:test";
import { inventoryItems, isLowStockProduct } from "../server/src/utils/inventory.js";

test("low stock uses any active variant rather than total product stock", () => {
  const product = {
    lowStockThreshold: 3,
    variants: [
      { stock: 20, active: true },
      { stock: 2, active: true },
      { stock: 0, active: false },
    ],
  };
  assert.equal(isLowStockProduct(product), true);
  assert.equal(inventoryItems(product).length, 2);
});

test("inactive variants and products without inventory do not create alerts", () => {
  assert.equal(isLowStockProduct({ lowStockThreshold: 3, variants: [{ stock: 0, active: false }] }), false);
  assert.equal(isLowStockProduct({ lowStockThreshold: 3, variants: [], sizeStock: [] }), false);
});

test("legacy size inventory remains supported", () => {
  assert.equal(isLowStockProduct({ lowStockThreshold: 1, sizeStock: [{ size: "0-3M", stock: 1 }] }), true);
});
