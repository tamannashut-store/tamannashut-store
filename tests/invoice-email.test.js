import test from "node:test";
import assert from "node:assert/strict";
import { sendInvoiceEmail } from "../server/src/services/invoiceEmailService.js";

const order = { _id: "66aa11bb22cc33dd44ee55ff", email: "customer@example.com", products: [], totalAmount: 299 };

test("mobile-only orders cannot report an invoice email as sent", async () => {
  await assert.rejects(sendInvoiceEmail({ ...order, email: "" }, { send: () => { throw new Error("Must not call provider"); } }), error => error.status === 400);
});

test("provider rejection cannot report invoice delivery success", async () => {
  await assert.rejects(sendInvoiceEmail(order, { send: async () => ({ sent: false }) }), error => error.status === 502);
});

test("accepted invoice email reports provider acceptance", async () => {
  const result = await sendInvoiceEmail(order, { send: async (to, subject, html) => {
    assert.equal(to, order.email);
    assert.match(subject, /Invoice 44EE55FF/);
    assert.match(html, /299/);
    return { sent: true, id: "test-message" };
  } });
  assert.equal(result.success, true);
  assert.equal(result.message, "Invoice accepted for email delivery");
});
