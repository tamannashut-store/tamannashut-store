import test from "node:test";
import assert from "node:assert/strict";
import { recordProductPresence, validPresenceVisitor } from "../server/src/utils/productPresence.js";

const visitor = "3b4f1120-5465-48b2-a022-111111111111";
test("presence accepts only an anonymous UUID, not identifiers or objects", () => {
  assert.equal(validPresenceVisitor(visitor), true);
  for (const value of [null, {}, { $ne: "" }, "email@example.com", "x".repeat(200)]) assert.equal(validPresenceVisitor(value), false);
});

test("duplicate tabs share one record, stale visitors and own browser are excluded", async () => {
  const now = new Date("2026-10-18T12:00:00Z");
  const records = new Map();
  const model = {
    async updateOne(filter, update) { records.set(filter._id, update.$set); },
    async countDocuments(filter) {
      return [...records.values()].filter((row) => row.productId === filter.productId && row.visitorId !== filter.visitorId.$ne && row.lastSeen > filter.lastSeen.$gt).length;
    },
  };
  records.set("old", { productId: "product", visitorId: "old", lastSeen: new Date(now - 91_000) });
  records.set("other-product", { productId: "different", visitorId: "another", lastSeen: now });
  assert.equal(await recordProductPresence(model, "product", visitor, now), 0);
  assert.equal(await recordProductPresence(model, "product", visitor, now), 0);
  assert.equal(records.size, 3);
  records.set("active", { productId: "product", visitorId: "another", lastSeen: new Date(now - 30_000) });
  assert.equal(await recordProductPresence(model, "product", visitor, now), 1);
  assert.equal(records.get(`product:${visitor}`).expiresAt.getTime(), now.getTime() + 90_000);
});

test("concurrent first heartbeats retry an existing record rather than duplicate it", async () => {
  let calls = 0;
  const model = {
    async updateOne(filter, update, options) {
      calls++;
      if (calls === 1) { assert.equal(options.upsert, true); throw Object.assign(new Error("duplicate"), { code: 11000 }); }
      assert.equal(options, undefined);
    },
    async countDocuments() { return 2; },
  };
  assert.equal(await recordProductPresence(model, "product", visitor), 2);
  assert.equal(calls, 2);
});
