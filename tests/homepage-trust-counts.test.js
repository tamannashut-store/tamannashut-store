import test from "node:test";
import assert from "node:assert/strict";
import { getStoreStats } from "../server/src/services/storeStats.js";

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
  } });
  assert.deepEqual(totals, { deliveredOrders: 3, customersServed: 2 });
});

test("empty store reports zero without manufacturing social proof", async () => {
  assert.deepEqual(await getStoreStats({ aggregate: () => ({ option: () => [] }) }), { deliveredOrders: 0, customersServed: 0 });
});
