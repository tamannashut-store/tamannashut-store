import test from "node:test";
import assert from "node:assert/strict";
import { productIdentifierFilter, slugifyProductName } from "../server/src/utils/productSlug.js";

test("product names become readable URL slugs", () => {
  assert.equal(slugifyProductName("Trendy Baby Suspender Shorts & Shirt Clothing Set"), "trendy-baby-suspender-shorts-and-shirt-clothing-set");
});

test("old product object IDs and new slugs remain supported", () => {
  assert.deepEqual(productIdentifierFilter("66ab1234fedcba9876543210"), { _id: "66ab1234fedcba9876543210" });
  assert.deepEqual(productIdentifierFilter("Trendy-Baby-Set"), { slug: "trendy-baby-set" });
});
