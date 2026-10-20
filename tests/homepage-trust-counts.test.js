import test from "node:test";
import assert from "node:assert/strict";
import { getStoreStats } from "../server/src/services/storeStats.js";
const zeroUsers = { countDocuments: () => ({ maxTimeMS: () => 0 }) };

test("public totals count only paid delivered orders and group repeat buyers", async () => {
  const totals = await getStoreStats({ aggregate(pipeline) {
    const match = pipeline[0].$match;
    assert.equal(match.status, "Delivered");
    assert.equal(match.paymentStatus, "Paid");
    assert.deepEqual(match.$or, [{ "refund.amount": { $exists: false } }, { "refund.amount": 0 }]);
    assert.deepEqual(pipeline[1].$group, { _id: "$userId", orders: { $sum: 1 } });
    assert.deepEqual(pipeline[2].$group, { _id: null, deliveredOrders: { $sum: "$orders" }, customersServed: { $sum: 1 } });
    assert.equal(pipeline[3].$project._id, 0);
    return { option(options) { assert.equal(options.maxTimeMS, 5000); return [{ deliveredOrders: 3, customersServed: 2 }]; } };
  } }, zeroUsers);
  assert.deepEqual(totals, { deliveredOrders: 3, customersServed: 2, registeredCustomers: 0, activeBags: 0 });
});

test("empty store reports zero without manufacturing social proof", async () => {
  assert.deepEqual(await getStoreStats({ aggregate: () => ({ option: () => [] }) }, zeroUsers), { deliveredOrders: 0, customersServed: 0, registeredCustomers: 0, activeBags: 0 });
});

test("registered customers exclude staff and active bags require items and recent activity", async () => {
  const now = new Date("2026-10-20T06:00:00Z");
  const filters = [];
  const User = { countDocuments(filter) { filters.push(filter); return { maxTimeMS: () => filters.length === 1 ? 12 : 3 }; } };
  const result = await getStoreStats({ aggregate: () => ({ option: () => [] }) }, User, now);
  assert.equal(result.registeredCustomers, 12);
  assert.equal(result.activeBags, 3);
  assert.deepEqual(filters[0], { accountType: "customer", isAdmin: { $ne: true } });
  assert.deepEqual(filters[1], { ...filters[0], "cart.0": { $exists: true }, cartUpdatedAt: { $gte: new Date("2026-10-19T06:00:00Z"), $lte: now } });
});
