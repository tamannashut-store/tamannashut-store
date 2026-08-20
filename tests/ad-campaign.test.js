import test from "node:test";
import assert from "node:assert/strict";
import { AD_PACKAGES, AD_PLACEMENTS, isAdEligibleProduct, isLiveCampaign } from "../server/src/utils/adCampaign.js";

test("seller ad packages use fixed server-owned prices", () => {
  assert.deepEqual(Object.keys(AD_PACKAGES), ["starter", "growth", "boost"]);
  assert.equal(AD_PACKAGES.starter.amount, 299);
  assert.equal(AD_PACKAGES.boost.days, 14);
  assert.deepEqual(AD_PLACEMENTS, ["home", "shop"]);
});

test("a seller can advertise only their own approved visible listing", () => {
  const product = { sellerId: "seller-a", status: "active", approvalStatus: "approved", sellerComplianceHold: false };
  assert.equal(isAdEligibleProduct(product, "seller-a"), true);
  assert.equal(isAdEligibleProduct(product, "seller-b"), false);
  assert.equal(isAdEligibleProduct({ ...product, approvalStatus: "pending" }, "seller-a"), false);
  assert.equal(isAdEligibleProduct({ ...product, sellerComplianceHold: true }, "seller-a"), false);
});

test("sponsored placement is live only inside the approved campaign window", () => {
  const now = new Date("2026-08-21T12:00:00Z");
  const campaign = { status: "active", startsAt: "2026-08-20T12:00:00Z", endsAt: "2026-08-22T12:00:00Z" };
  assert.equal(isLiveCampaign(campaign, now), true);
  assert.equal(isLiveCampaign({ ...campaign, status: "paused" }, now), false);
  assert.equal(isLiveCampaign({ ...campaign, endsAt: now }, now), false);
});
