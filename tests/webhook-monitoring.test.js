import test from "node:test";
import assert from "node:assert/strict";
import { razorpayWebhookContext, shiprocketWebhookContext } from "../server/src/utils/webhookMonitoring.js";

test("Shiprocket monitoring context excludes customer data and secrets", () => {
  const context = shiprocketWebhookContext({
    shipment_id: "shipment-123",
    current_status_id: 7,
    awb: "AWB-SECRET",
    customer_name: "Private Customer",
    email: "private@example.com",
    token: "do-not-send",
  });
  assert.deepEqual(context, { shipmentId: "shipment-123", statusId: "7", hasAwb: true });
  assert.equal(JSON.stringify(context).includes("Private Customer"), false);
  assert.equal(JSON.stringify(context).includes("do-not-send"), false);
  assert.equal(JSON.stringify(context).includes("AWB-SECRET"), false);
});

test("Razorpay monitoring context excludes payment identifiers and payload data", () => {
  const context = razorpayWebhookContext({
    event: "refund.failed",
    payload: {
      payment: { entity: { id: "pay_secret", email: "private@example.com" } },
      refund: { entity: { id: "rfnd_secret", payment_id: "pay_secret" } },
    },
  });
  assert.deepEqual(context, { eventType: "refund.failed", hasPayment: true, hasRefund: true });
  const serialized = JSON.stringify(context);
  assert.equal(serialized.includes("pay_secret"), false);
  assert.equal(serialized.includes("private@example.com"), false);
});
