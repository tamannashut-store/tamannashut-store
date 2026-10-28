import test from "node:test";
import assert from "node:assert/strict";
import { ENROLMENT_SELLER_ID } from "../server/src/utils/enrolmentSeller.js";
import { createReturnShipment } from "../server/src/services/returnShipmentService.js";
import { requirePlatformPickupOrder } from "../server/src/utils/shipmentPickupGuard.js";
import { createShiprocketOrder, getShiprocketCouriers, createShiprocketReturn, getShiprocketReturnCouriers } from "../server/src/services/shiprocketService.js";

test("legacy platform orders retain their current pickup flow", () => {
  assert.doesNotThrow(() => requirePlatformPickupOrder({ products: [], sellerFulfillments: [] }));
});

test("blocked seller returns do not claim a creation attempt or query the provider", async () => {
  const unexpected = async () => { assert.fail("Blocked return must have no side effects"); };
  await assert.rejects(createReturnShipment({ sellerFulfillments: [{ sellerId: "seller-a" }] }, {}, {
    model: { findOneAndUpdate: unexpected, updateOne: unexpected },
    findExisting: unexpected, create: unexpected,
  }), { status: 409 });
});

test("seller shipments cannot call the provider using the platform pickup", async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Unexpected provider request"); };
  try {
    for (const order of [
      { sellerFulfillments: [{ sellerId: "seller-a" }] },
      { sellerFulfillments: [{ sellerId: "seller-a" }, { sellerId: "seller-b" }] },
      { enrolmentSupplier: { name: "Kismat Collection" } },
      { products: [{ sellerId: ENROLMENT_SELLER_ID }] },
      { products: [{ sellerId: { _id: ENROLMENT_SELLER_ID } }] },
    ]) {
      assert.throws(() => getShiprocketCouriers(order, {}), { status: 409 });
      assert.throws(() => getShiprocketReturnCouriers(order, {}), { status: 409 });
      await assert.rejects(createShiprocketOrder(order, {}), { status: 409 });
      await assert.rejects(createShiprocketReturn(order, {}), { status: 409 });
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previousFetch; }
});
