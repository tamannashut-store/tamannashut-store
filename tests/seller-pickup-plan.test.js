import test from "node:test";
import assert from "node:assert/strict";
import { planSellerPickup } from "../server/src/utils/sellerPickupPlan.js";

const order = () => ({
  products: [{ sellerId: "seller-a", sku: "one" }, { sellerId: "seller-a", sku: "two" }],
  sellerFulfillments: [{ sellerId: "seller-a", pickupAddress: { pincode: "711302" } }],
});
const mappings = { "seller-a": { location: "Home-1", postcode: "711302" } };

test("single-origin plan uses an explicit seller mapping and matching order snapshot", () => {
  assert.deepEqual(planSellerPickup(order(), mappings), { sellerId: "seller-a", location: "Home-1", postcode: "711302" });
});

test("mixed baskets cannot be shipped as one seller shipment", () => {
  const mixed = order();
  mixed.products.push({ sellerId: "seller-b" });
  assert.throws(() => planSellerPickup(mixed, mappings), { status: 409 });
  mixed.sellerFulfillments.push({ sellerId: "seller-b" });
  assert.throws(() => planSellerPickup(mixed, mappings), { status: 409 });
});

test("missing, stale and invalid mappings cannot fall back to the platform warehouse", () => {
  for (const mapping of [{}, { "seller-a": { location: "Home-1", postcode: "711313" } }, { "seller-a": { location: "", postcode: "711302" } }]) {
    assert.throws(() => planSellerPickup(order(), mapping), { status: 409 });
  }
  const missingSnapshot = order();
  delete missingSnapshot.sellerFulfillments[0].pickupAddress;
  assert.throws(() => planSellerPickup(missingSnapshot, mappings), { status: 409 });
  const incomplete = order();
  delete incomplete.products[0].sellerId;
  assert.throws(() => planSellerPickup(incomplete, mappings), { status: 409 });
});
