import test from "node:test";
import assert from "node:assert/strict";
import Product from "../server/src/models/Product.js";
import { calculateCart } from "../server/src/services/orderService.js";

const id = "507f1f77bcf86cd799439011";
const product = { _id: id, name: "Steel bottle", price: 500, gstMode: "custom", gstRate: 12, hsnCode: "7323", optionLabel: "Capacity", brand: "Example", weightKg: 0.4, variants: [{ sku: "BOTTLE-1L", size: "1 litre", color: "", price: 500, stock: 3, active: true }, { sku: "BOTTLE-2L", size: "2 litres", price: 600, stock: 10, active: false }], sizeStock: [{ size: "1 litre", stock: 3 }, { size: "2 litres", stock: 10 }], images: [{ url: "bottle.jpg" }] };

test("checkout snapshots product-specific tax, option and shipping information", async () => {
  const originalFind = Product.find;
  Product.find = () => ({ lean: async () => [product] });
  try {
    const cart = await calculateCart([{ _id: id, selectedSize: "1 litre", selectedSku: "BOTTLE-1L", qty: 2 }]);
    assert.equal(cart.totalAmount, 1000);
    assert.equal(cart.products[0].gstRate, 12);
    assert.equal(cart.products[0].hsnCode, "7323");
    assert.equal(cart.products[0].optionLabel, "Capacity");
    assert.equal(cart.products[0].weightKg, 0.4);
  } finally { Product.find = originalFind; }
});

test("checkout cannot bypass inactive or forged SKUs using legacy aggregate stock", async () => {
  const originalFind = Product.find;
  Product.find = () => ({ lean: async () => [product] });
  try {
    for (const [selectedSku, selectedSize] of [["BOTTLE-2L", "2 litres"], ["FAKE", "1 litre"], ["BOTTLE-1L", "2 litres"]]) {
      await assert.rejects(calculateCart([{ _id: id, selectedSku, selectedSize, qty: 1 }]), { status: 409 });
    }
  } finally { Product.find = originalFind; }
});
