import test from "node:test";
import assert from "node:assert/strict";
import { isStorefrontProduct, storefrontProductFilter } from "../server/src/utils/productVisibility.js";

test("storefront catalogue combines approved listings from every seller", () => {
  const filter = storefrontProductFilter({ category: "girls" });
  assert.equal(filter.category, "girls");
  assert.equal(Object.hasOwn(filter, "sellerId"), false);
  assert.deepEqual(filter.approvalStatus, { $in: ["approved", "not_required"] });
});

test("pending, rejected, draft and archived listings are not purchasable", () => {
  assert.equal(isStorefrontProduct({ status: "active", approvalStatus: "approved" }), true);
  assert.equal(isStorefrontProduct({ status: "active", approvalStatus: "not_required" }), true);
  assert.equal(isStorefrontProduct({ status: "draft", approvalStatus: "approved" }), false);
  assert.equal(isStorefrontProduct({ status: "active", approvalStatus: "pending" }), false);
  assert.equal(isStorefrontProduct({ status: "active", approvalStatus: "rejected" }), false);
});
