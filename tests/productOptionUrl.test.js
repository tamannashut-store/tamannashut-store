import test from "node:test";
import assert from "node:assert/strict";
import { productOptionUrl } from "../client/src/utils/productUrl.js";

test("shared product options round trip without leaking current-page parameters", () => {
  const url = new URL(productOptionUrl({ slug: "boys-set" }, "https://www.tamannashut.com", { color: "White – Border Jacket", size: "6–9 Months" }));
  assert.equal(url.pathname, "/product/boys-set");
  assert.equal(url.searchParams.get("color"), "White – Border Jacket");
  assert.equal(url.searchParams.get("size"), "6–9 Months");
  assert.equal(url.searchParams.size, 2);
  assert.equal(url.hash, "");
});
test("simple products have a clean URL and ID fallback", () => {
  assert.equal(productOptionUrl({ _id: "abc" }, "https://www.tamannashut.com"), "https://www.tamannashut.com/product/abc");
});
