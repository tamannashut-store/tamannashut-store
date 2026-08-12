import test from "node:test";
import assert from "node:assert/strict";
import { effectivePaymentStatus, paymentMethodLabel, paymentStatusLabel } from "../server/src/utils/paymentPresentation.js";

test("historical cancelled COD orders never appear unpaid-and-pending", () => {
  const order = { paymentMethod: "COD", paymentStatus: "Pending", status: "Cancelled" };
  assert.equal(effectivePaymentStatus(order), "Not Collected");
  assert.equal(paymentMethodLabel(order), "Cash on Delivery");
  assert.equal(paymentStatusLabel(order), "No Payment Collected");
});

test("historical delivered COD orders appear collected", () => {
  const order = { paymentMethod: "COD", paymentStatus: "Pending", status: "Delivered" };
  assert.equal(effectivePaymentStatus(order), "Paid");
  assert.equal(paymentStatusLabel(order), "Collected on Delivery");
});

test("online and refunded orders retain accurate payment meaning", () => {
  assert.equal(paymentStatusLabel({ paymentMethod: "Online", paymentStatus: "Paid", paymentId: "pay_verified", status: "Confirmed" }), "Paid Online");
  assert.equal(paymentStatusLabel({ paymentMethod: "Online", paymentStatus: "Paid", status: "Confirmed" }), "Pending");
  assert.equal(paymentStatusLabel({ paymentMethod: "Online", paymentStatus: "Refunded", status: "Refunded" }), "Refunded");
});
