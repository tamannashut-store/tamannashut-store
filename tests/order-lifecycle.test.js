import test from "node:test";
import assert from "node:assert/strict";
import { shouldRecordOrderTransition, syncCodPaymentStatus } from "../server/src/utils/orderLifecycle.js";

test("delivered COD orders are recorded as collected", () => {
  const order = { paymentMethod: "COD", paymentStatus: "Pending" };
  syncCodPaymentStatus(order, "Delivered");
  assert.equal(order.paymentStatus, "Paid");
});

test("cancelled and RTO COD orders are recorded as not collected", () => {
  for (const status of ["Cancelled", "RTO Initiated", "RTO Delivered"]) {
    const order = { paymentMethod: "COD", paymentStatus: "Pending" };
    syncCodPaymentStatus(order, status);
    assert.equal(order.paymentStatus, "Not Collected");
  }
});

test("online and already refunded payments are not rewritten", () => {
  const online = { paymentMethod: "Online", paymentStatus: "Paid" };
  syncCodPaymentStatus(online, "Cancelled");
  assert.equal(online.paymentStatus, "Paid");

  const refunded = { paymentMethod: "COD", paymentStatus: "Refunded" };
  syncCodPaymentStatus(refunded, "RTO Delivered");
  assert.equal(refunded.paymentStatus, "Refunded");
});

test("repeated courier statuses do not create duplicate lifecycle events", () => {
  assert.equal(shouldRecordOrderTransition("Shipped", "Shipped"), false);
  assert.equal(shouldRecordOrderTransition("Shipped", "Delivered"), true);
  assert.equal(shouldRecordOrderTransition("Delivered", "Shipped"), false);
  assert.equal(shouldRecordOrderTransition("Delivered", undefined), false);
});
