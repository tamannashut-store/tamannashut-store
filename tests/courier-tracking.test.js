import test from "node:test";
import assert from "node:assert/strict";
import { courierStatus, courierProgress } from "../server/src/utils/courierLifecycle.js";
import { applyCourierProgress, syncShipmentTracking } from "../server/src/services/shipmentTrackingService.js";

test("pickup scheduling does not imply collection; delivered catches up without regressing final states", () => {
  assert.equal(courierStatus(19), undefined);
  assert.equal(courierStatus(42), "Shipped");
  assert.deepEqual(courierProgress("Packed", courierStatus(7)), ["Shipped", "Delivered"]);
  for (const status of ["Delivered", "Returned", "Refunded", "Cancelled", "RTO Delivered"]) assert.deepEqual(courierProgress(status, "Shipped"), []);
});

test("overlapping courier updates record delivery and send notification only once", async () => {
  const original = { _id: "order", status: "Packed", shipping: { awbCode: "AWB" }, paymentMethod: "COD", paymentStatus: "Pending", email: "customer@example.test" };
  let stored = structuredClone(original); const history = []; let notices = 0;
  const Orders = { async findOneAndUpdate(filter, update) {
    assert.equal(filter["shipping.awbCode"], "AWB");
    if (stored.status !== filter.status) return null;
    stored = { ...stored, ...update.$set };
    history.push(...(update.$push?.statusHistory.$each || []));
    return stored;
  } };
  const dependencies = { Orders, notify: async () => { notices++; } };
  await Promise.all([applyCourierProgress(original, { current_status_id: 7, current_status: "DELIVERED" }, dependencies), applyCourierProgress(original, { current_status_id: 7, current_status: "DELIVERED" }, dependencies)]);
  assert.equal(stored.status, "Delivered"); assert.equal(stored.paymentStatus, "Paid");
  assert.deepEqual(history.map(entry => entry.status), ["Shipped", "Delivered"]); assert.equal(notices, 1);
});

test("tracking rejects unavailable or mismatched shipments before touching the order", async () => {
  const order = { shipping: { awbCode: "EXPECTED" } }; let applied = 0;
  for (const tracking_data of [{ track_status: 0 }, { track_status: 1, shipment_track: [{ awb_code: "OTHER" }] }]) {
    await assert.rejects(syncShipmentTracking(order, { track: async () => ({ tracking_data }), apply: async () => { applied++; } }), error => error.status === 502);
  }
  assert.equal(applied, 0);
  await syncShipmentTracking(order, { track: async awb => ({ tracking_data: { track_status: 1, shipment_status: 42, shipment_track: [{ awb_code: awb, current_status: "PICKED UP" }] } }), apply: async (_order, event) => { assert.equal(event.current_status_id, 42); applied++; } });
  assert.equal(applied, 1);
});
