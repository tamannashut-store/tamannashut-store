import test from "node:test";
import assert from "node:assert/strict";
import { customerPaymentLabel, returnWindow } from "../client/src/utils/orderPresentation.js";

test("customer account does not claim an unverified online payment was received", () => {
  assert.equal(customerPaymentLabel({ paymentMethod: "Online", paymentStatus: "Pending" }), "Online payment · Confirmation pending");
  assert.equal(customerPaymentLabel({ paymentMethod: "Online", paymentStatus: "Paid" }), "Online payment · Confirmation pending");
  assert.equal(customerPaymentLabel({ paymentMethod: "Online", paymentStatus: "Paid", paymentId: "pay_test" }), "Paid online");
});

test("COD history distinguishes collected, uncollected and refunded payments", () => {
  assert.equal(customerPaymentLabel({ paymentMethod: "COD", status: "Delivered" }), "Cash collected on delivery");
  assert.equal(customerPaymentLabel({ paymentMethod: "COD", status: "Cancelled" }), "Cash on delivery · No payment collected");
  assert.equal(customerPaymentLabel({ paymentMethod: "COD", status: "Refunded" }), "Cash on delivery · Refunded");
});

test("return deadline matches the server's seven-day boundary and latest delivery event", () => {
  const date = Date.parse("2026-10-01T10:00:00Z");
  const order = { statusHistory: [{ status: "Delivered", createdAt: "2026-09-01" }, { status: "Shipped", createdAt: "2026-09-30" }, { status: "Delivered", createdAt: new Date(date) }] };
  assert.deepEqual(returnWindow(order, date + 7 * 86400000), { deadline: date + 7 * 86400000, closed: false });
  assert.equal(returnWindow(order, date + 7 * 86400000 + 1).closed, true);
});

test("legacy orders without a valid delivery date remain subject to server eligibility", () => {
  assert.deepEqual(returnWindow({}), { deadline: null, closed: false });
  assert.deepEqual(returnWindow({ statusHistory: [{ status: "Delivered", createdAt: "invalid" }] }), { deadline: null, closed: false });
});
