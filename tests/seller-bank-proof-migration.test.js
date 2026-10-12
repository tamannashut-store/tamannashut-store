import test from "node:test";
import assert from "node:assert/strict";
import { reconcileSellerCompliance } from "../server/src/utils/sellerComplianceMigration.js";
import { effectiveSellerVerification } from "../server/src/utils/sellerOnboarding.js";

test("previously approved sellers without proof immediately require an update", () => {
  const result = effectiveSellerVerification({ verificationStatus: "verified", gstVerification: { status: "verified" }, bankVerification: { status: "verified" } });
  assert.equal(result.status, "needs_update");
  assert.ok(result.missingFields.includes("Bank ownership document"));
});

test("rollout pauses missing-proof sellers, preserves suspended status and excludes administrators", async () => {
  const access = []; const holds = [];
  const sellers = [{ _id: "existing", accountType: "seller", sellerAccessStatus: "active" },
    { _id: "suspended", accountType: "seller", sellerAccessStatus: "suspended" },
    { _id: "owner", accountType: "platform_admin", sellerRole: "member", sellerAccessStatus: "active" }];
  await reconcileSellerCompliance({
    User: { find: () => ({ select: () => ({ lean: async () => sellers }) }), updateOne: async (filter, update) => access.push({ filter, update }) },
    SellerProfile: { find: () => ({ lean: async () => [{ userId: "existing", verificationStatus: "verified" }] }) },
    Product: { updateMany: async (filter, update) => { holds.push({ filter, update }); return { modifiedCount: 1 }; } },
  });
  assert.deepEqual(access, [{ filter: { _id: "existing", sellerAccessStatus: "active" }, update: { $set: { sellerAccessStatus: "pending" } } }]);
  assert.equal(holds.length, 2);
  assert.ok(holds.every((value) => value.update.$set.sellerComplianceHold === true));
  assert.equal(holds.some((value) => value.filter.sellerId === "owner"), false);
});
