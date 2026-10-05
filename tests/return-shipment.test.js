import test from "node:test";
import assert from "node:assert/strict";
import { createReturnShipment } from "../server/src/services/returnShipmentService.js";
import { shiprocketShipment, requirePickupSuccess } from "../server/src/utils/shiprocketResponse.js";
import Order from "../server/src/models/Order.js";

const parcel = { weight: 0.5, length: 15, breadth: 12, height: 5 };
const fixture = (state = "") => ({ _id: "66aa11bb22cc33dd44ee55ff", status: "Return Approved", returnRequest: { reverseShipmentId: "", reverseCreationStatus: state }, statusHistory: [] });
const memoryModel = (order) => {
  const set = (update) => {
    for (const [path, value] of Object.entries(update.$set || {})) {
      const [parent, key] = path.split(".");
      order[parent][key] = value;
    }
    if (update.$push) order.statusHistory.push(update.$push.statusHistory);
  };
  return {
    findOneAndUpdate: async (filter, update) => {
      if (filter.status && order.status !== filter.status) return null;
      const expectedState = filter["returnRequest.reverseCreationStatus"];
      if (expectedState !== undefined && (expectedState.$in ? !expectedState.$in.includes(order.returnRequest.reverseCreationStatus ?? null) : expectedState !== order.returnRequest.reverseCreationStatus)) return null;
      if (filter["returnRequest.reverseCreationStartedAt"] && +filter["returnRequest.reverseCreationStartedAt"] !== +order.returnRequest.reverseCreationStartedAt) return null;
      if (filter["returnRequest.reverseShipmentId"] && order.returnRequest.reverseShipmentId) return null;
      set(update);
      return structuredClone(order);
    },
    updateOne: async (_filter, update) => set(update),
  };
};

test("return responses accept nested and list envelopes, and reject missing shipment IDs", () => {
  for (const response of [{ shipment_id: 12, order_id: 34 }, { data: { shipment_id: 12, order_id: 34 } }, { response: { data: [{ shipment_id: 12, order_id: 34 }] } }]) {
    assert.deepEqual(shiprocketShipment(response), { shipmentId: "12", orderId: "34", awb: "" });
  }
  assert.deepEqual(shiprocketShipment({ id: 34, shipments: [{ id: 12, awb: "RET123" }] }), { shipmentId: "12", orderId: "34", awb: "RET123" });
  assert.equal(shiprocketShipment({ status: true, data: { order_id: 34 } }), null);
  assert.equal(shiprocketShipment({ shipment_id: "undefined" }), null);
});

test("provider pickup failures cannot be recorded as scheduled", () => {
  assert.doesNotThrow(() => requirePickupSuccess({ pickup_status: 1 }));
  assert.throws(() => requirePickupSuccess({ pickup_status: 0, message: "AWB required" }), /AWB required/);
  assert.throws(() => requirePickupSuccess({}), /not confirmed/);
});

test("nested creation response saves return IDs and package dimensions", async () => {
  const order = fixture();
  const result = await createReturnShipment(structuredClone(order), parcel, { model: memoryModel(order), findExisting: async () => null, create: async () => ({ data: { shipment_id: 12, order_id: 34 } }) });
  assert.equal(result.order.returnRequest.reverseShipmentId, "12");
  assert.equal(result.order.returnRequest.reverseCreationStatus, "created");
  assert.deepEqual(result.order.returnRequest.reversePackage, parcel);
  assert.equal(result.existing, false);
});

test("a return already created in Shiprocket is synced without creating another", async () => {
  const order = fixture();
  let creates = 0;
  const result = await createReturnShipment(structuredClone(order), parcel, { model: memoryModel(order), findExisting: async () => ({ shipmentId: "12", orderId: "34", awb: "RET123" }), create: async () => { creates++; } });
  assert.equal(creates, 0);
  assert.equal(result.existing, true);
  assert.equal(order.returnRequest.reverseAwb, "RET123");
});

test("legacy orders without a creation-state field can create a return", async () => {
  const order = fixture();
  delete order.returnRequest.reverseCreationStatus;
  const result = await createReturnShipment(structuredClone(order), parcel, { model: memoryModel(order), findExisting: async () => null, create: async () => ({ shipment_id: 12, order_id: 34 }) });
  assert.equal(result.order.returnRequest.reverseShipmentId, "12");
});

test("concurrent return requests call the provider only once", async () => {
  const order = fixture();
  const initial = structuredClone(order);
  let creates = 0;
  const dependencies = { model: memoryModel(order), findExisting: async () => null, create: async () => { creates++; return { shipment_id: 12, order_id: 34 }; } };
  const results = await Promise.allSettled([createReturnShipment(structuredClone(initial), parcel, dependencies), createReturnShipment(structuredClone(initial), parcel, dependencies)]);
  assert.equal(creates, 1);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.find((result) => result.status === "rejected").reason.status, 409);
});

test("an uncertain provider result blocks recreation and permits later sync", async () => {
  const order = fixture();
  const model = memoryModel(order);
  await assert.rejects(createReturnShipment(structuredClone(order), parcel, { model, findExisting: async () => null, create: async () => { throw new Error("Connection lost after creation"); } }), /Connection lost/);
  assert.equal(order.returnRequest.reverseCreationStatus, "reconcile");
  let creates = 0;
  await assert.rejects(createReturnShipment(structuredClone(order), parcel, { model, findExisting: async () => null, create: async () => { creates++; } }), /previous request may have created/);
  assert.equal(creates, 0);
  const result = await createReturnShipment(structuredClone(order), parcel, { model, findExisting: async () => ({ shipmentId: "12", orderId: "34", awb: "" }) });
  assert.equal(result.order.returnRequest.reverseShipmentId, "12");
});

test("failure to persist a created shipment leaves a recoverable state", async () => {
  const order = fixture();
  const model = memoryModel(order);
  const originalUpdate = model.findOneAndUpdate;
  model.findOneAndUpdate = (filter, update) => update.$set["returnRequest.reverseShipmentId"] ? Promise.reject(new Error("Database unavailable")) : originalUpdate(filter, update);
  await assert.rejects(createReturnShipment(structuredClone(order), parcel, { model, findExisting: async () => null, create: async () => ({ data: { shipment_id: 12, order_id: 34 } }) }), /Database unavailable/);
  assert.equal(order.returnRequest.reverseCreationStatus, "reconcile");
});

test("the return recovery state and parcel details survive model validation", async () => {
  const order = new Order({ userId: "66aa11bb22cc33dd44ee55ff", returnRequest: { reverseCreationStatus: "reconcile", reversePackage: parcel } });
  await order.validate();
  assert.equal(order.returnRequest.reverseCreationStatus, "reconcile");
  assert.equal(order.returnRequest.reversePackage.weight, 0.5);
});
