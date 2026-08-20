import test from "node:test";
import assert from "node:assert/strict";
import { productStructuredData } from "../client/src/utils/productStructuredData.js";

const product = {
  name: "Cotton set",
  description: "Soft cotton kidswear",
  baseSku: "TH-COTTON",
  category: "girls",
  price: 299,
  variants: [{ size: "0-3M", color: "Orange", stock: 2, active: true }],
  reviews: [{ rating: 5 }],
  averageRating: 5,
};

test("product structured data describes Indian delivery and return terms", () => {
  const schema = productStructuredData(product, "/product/cotton-set", [{ url: "https://images.example/product.jpg" }]);
  assert.equal(schema.offers.url, "https://www.tamannashut.com/product/cotton-set");
  assert.equal(schema.offers.availability, "https://schema.org/InStock");
  assert.equal(schema.offers.shippingDetails.shippingDestination.addressCountry, "IN");
  assert.deepEqual(schema.offers.shippingDetails.deliveryTime.transitTime, { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" });
  assert.equal(schema.offers.hasMerchantReturnPolicy.merchantReturnDays, 7);
  assert.equal(schema.offers.hasMerchantReturnPolicy.returnFees, "https://schema.org/ReturnShippingFees");
  assert.equal(schema.offers.hasMerchantReturnPolicy.merchantReturnLink, "https://www.tamannashut.com/return-policy");
  assert.equal(schema.aggregateRating.reviewCount, 1);
});

test("structured availability ignores inactive stock and supports legacy inventory", () => {
  const inactive = productStructuredData({ ...product, variants: [{ stock: 9, active: false }], reviews: [] }, "/product/inactive");
  assert.equal(inactive.offers.availability, "https://schema.org/OutOfStock");
  assert.equal("aggregateRating" in inactive, false);

  const legacy = productStructuredData({ ...product, variants: [], sizeStock: [{ size: "3-6M", stock: 1 }] }, "/product/legacy");
  assert.equal(legacy.offers.availability, "https://schema.org/InStock");
});
