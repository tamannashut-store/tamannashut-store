import test from "node:test";
import assert from "node:assert/strict";
import { welcomePromotionDecision } from "../server/src/utils/welcomePromotion.js";

test("eligible first orders receive an exact ten percent discount", () => {
  assert.deepEqual(welcomePromotionDecision({ subtotal: 299, eligible: true }), { applied: true, discount: 29.9 });
});

test("welcome discount does not stack and preserves a better coupon", () => {
  assert.deepEqual(welcomePromotionDecision({ subtotal: 1000, existingDiscount: 200, eligible: true }), { applied: false, discount: 200 });
  assert.deepEqual(welcomePromotionDecision({ subtotal: 1000, existingDiscount: 50, eligible: true }), { applied: true, discount: 100 });
});

test("ineligible accounts never receive the welcome discount", () => {
  assert.deepEqual(welcomePromotionDecision({ subtotal: 1000, eligible: false }), { applied: false, discount: 0 });
});
