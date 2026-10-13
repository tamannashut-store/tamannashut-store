import test from "node:test";
import assert from "node:assert/strict";
import { publicStoreStats } from "../server/src/utils/storeStats.js";

test("store metrics count only visible listings, approved ratings and customer followers, without exposing identities", async () => {
  const id = "66aa11bb22cc33dd44ee5500";
  const result = await publicStoreStats({ id, name: "Example Store" }, {
    Products: {
      countDocuments: async filter => { assert.equal(filter.sellerId, id); assert.equal(filter.status, "active"); assert.equal(filter.sellerComplianceHold.$ne, true); return 2; },
      aggregate: async pipeline => {
        assert.equal(String(pipeline[0].$match.sellerId), id);
        assert.deepEqual(pipeline[0].$match.approvalStatus.$in, ["approved", "not_required"]);
        const reviewFilter = pipeline.find(stage => stage.$match?.["reviews.status"]).$match;
        assert.deepEqual(reviewFilter["reviews.status"].$in, ["approved", null]);
        assert.equal(reviewFilter["reviews.rating"].$gte, 1); assert.equal(reviewFilter["reviews.rating"].$lte, 5);
        return [{ ratingCount: 3, averageRating: 14 / 3 }];
      },
    },
    Users: { countDocuments: async filter => { assert.deepEqual(filter, { accountType: "customer", followedStores: id }); return 12; } },
  });
  assert.deepEqual(result, { id, name: "Example Store", productCount: 2, followerCount: 12, ratingCount: 3, averageRating: 14 / 3 });
});

test("stores with no approved ratings retain a truthful zero rating count", async () => {
  const result = await publicStoreStats({ id: "66aa11bb22cc33dd44ee5500" }, { Products: { countDocuments: async () => 2, aggregate: async () => [] }, Users: { countDocuments: async () => 0 } });
  assert.equal(result.averageRating, 0); assert.equal(result.ratingCount, 0); assert.equal(result.followerCount, 0);
});
