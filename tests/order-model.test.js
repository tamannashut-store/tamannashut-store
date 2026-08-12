import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Order from "../server/src/models/Order.js";

test("new orders default to a non-paid payment state", () => {
  const order = new Order({ userId: new mongoose.Types.ObjectId() });
  assert.equal(order.paymentStatus, "Pending");
});

test("order payment fields reject unknown values", async () => {
  const order = new Order({
    userId: new mongoose.Types.ObjectId(),
    paymentMethod: "Bank transfer",
    paymentStatus: "Successful",
  });
  await assert.rejects(order.validate(), (error) => {
    assert.ok(error?.errors?.paymentMethod);
    assert.ok(error?.errors?.paymentStatus);
    return true;
  });
});
