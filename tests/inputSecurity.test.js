import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmailAddress, objectIdFromInput, razorpayIdFromInput } from "../server/src/utils/inputSecurity.js";

test("email validation accepts normal addresses and rejects malformed or oversized input", () => {
  assert.equal(isValidEmailAddress("customer@example.com"), true);
  assert.equal(isValidEmailAddress("customer+orders@example.co.in"), true);
  assert.equal(isValidEmailAddress("missing-domain@"), false);
  assert.equal(isValidEmailAddress("two@@example.com"), false);
  assert.equal(isValidEmailAddress(`${"a".repeat(250)}@example.com`), false);
});

test("database identifiers become typed ObjectIds and reject operator objects", () => {
  assert.equal(String(objectIdFromInput("507f1f77bcf86cd799439011")), "507f1f77bcf86cd799439011");
  assert.throws(() => objectIdFromInput({ $ne: null }), /valid identifier/);
  assert.throws(() => objectIdFromInput("not-an-object-id"), /valid identifier/);
});

test("Razorpay identifiers accept expected scalar prefixes only", () => {
  assert.equal(razorpayIdFromInput("order_ABC123", "order"), "order_ABC123");
  assert.equal(razorpayIdFromInput("pay_ABC123", "pay"), "pay_ABC123");
  assert.throws(() => razorpayIdFromInput({ $gt: "" }, "order"), /Invalid payment identifier/);
  assert.throws(() => razorpayIdFromInput("pay_ABC123", "order"), /Invalid payment identifier/);
});
