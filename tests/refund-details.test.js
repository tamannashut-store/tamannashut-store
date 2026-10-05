import test from "node:test";
import assert from "node:assert/strict";
import { needsRefundDetails, normalizeRefundDestination, maskRefundDestination, encryptRefundDestination, decryptRefundDestination } from "../server/src/utils/refundDestination.js";
import RefundDestination from "../server/src/models/RefundDestination.js";
import { refundDetailsRequestEmailTemplate } from "../server/src/utils/emailTemplates.js";
import { admin } from "../server/src/middleware/authMiddleware.js";

process.env.REFUND_DATA_ENCRYPTION_KEY = "refund-destination-test-key-32-characters";
process.env.RESEND_API_KEY = "re_test_mock_only";
const { refundDetailsHandlers } = await import("../server/src/routes/refundDetailsRoutes.js");
const { notifyRefundDetails } = await import("../server/src/services/refundDetailsNotification.js");
const orderId = "66aa11bb22cc33dd44ee55ff";
const userId = "66aa11bb22cc33dd44ee5500";
const pending = () => ({ _id: orderId, userId, status: "Refund Pending", paymentMethod: "COD", paymentStatus: "Paid", email: "test@example.com", customerName: "<Customer>", refund: {} });
const res = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
const upi = { method: "UPI", holderName: "Test Customer", upiId: "test.customer@bank" };

test("only collected COD refunds request customer payment details", () => {
  assert.equal(needsRefundDetails(pending()), true);
  for (const changes of [{ paymentMethod: "Online" }, { paymentStatus: "Pending" }, { paymentStatus: "Not Collected" }, { status: "Returned" }, { status: "Refunded" }]) assert.equal(needsRefundDetails({ ...pending(), ...changes }), false);
});
test("refund destinations validate bank confirmation and exclude unrelated secrets", () => {
  assert.deepEqual(normalizeRefundDestination({ ...upi, otp: "123456", pin: "4321", password: "private" }), upi);
  assert.throws(() => normalizeRefundDestination({ ...upi, upiId: "invalid" }), /UPI/);
  const bank = { method: "Bank transfer", holderName: "Test Customer", accountNumber: "01234567890", confirmAccountNumber: "01234567890", ifsc: "abcd0123456" };
  const result = normalizeRefundDestination(bank);
  assert.equal(result.accountNumber, "01234567890");
  assert.equal(result.ifsc, "ABCD0123456");
  assert.equal("confirmAccountNumber" in result, false);
  assert.throws(() => normalizeRefundDestination({ ...bank, confirmAccountNumber: "123456" }), /do not match/);
  assert.throws(() => normalizeRefundDestination({ ...bank, ifsc: "INVALID" }), /IFSC/);
});
test("refund details are encrypted, tamper resistant and masked in normal responses", () => {
  const encrypted = encryptRefundDestination(upi);
  assert.equal(encrypted.includes(upi.upiId), false);
  assert.deepEqual(decryptRefundDestination(encrypted), upi);
  const parts = encrypted.split(".");
  const tag = Buffer.from(parts[1], "base64url"); tag[0] ^= 1; parts[1] = tag.toString("base64url");
  assert.throws(() => decryptRefundDestination(parts.join(".")));
  assert.equal(maskRefundDestination(upi), "te***@bank");
  const document = new RefundDestination({ orderId, userId, method: "UPI", maskedDestination: maskRefundDestination(upi), encryptedDetails: encrypted });
  assert.equal("encryptedDetails" in document.toJSON(), false);
  assert.equal("encryptedDetails" in document.toObject(), false);
  assert.equal(RefundDestination.schema.path("encryptedDetails").options.select, false);
});
test("missing encryption configuration fails without storing plaintext", () => {
  const secret = process.env.REFUND_DATA_ENCRYPTION_KEY;
  delete process.env.REFUND_DATA_ENCRYPTION_KEY;
  delete process.env.SELLER_DATA_ENCRYPTION_KEY;
  assert.throws(() => encryptRefundDestination(upi), { status: 503 });
  process.env.REFUND_DATA_ENCRYPTION_KEY = secret;
});
test("refund email links to the signed-in order without including banking details", () => {
  const html = refundDetailsRequestEmailTemplate({ ...pending(), upiId: upi.upiId, accountNumber: "123456789" });
  assert.match(html, new RegExp(`/my-orders#${orderId}`));
  assert.match(html, /&lt;Customer&gt;/);
  assert.match(html, /UPI PIN, OTP or password/);
  assert.equal(html.includes(upi.upiId), false);
  assert.equal(html.includes("123456789"), false);
});
test("customer cannot access or submit another customer's refund destination", async () => {
  let writes = 0;
  const handlers = refundDetailsHandlers({ orders: { findOne: async (filter) => { assert.equal(filter.userId, "other-user"); return null; } }, destinations: { findOneAndUpdate: async () => { writes++; } } });
  for (const name of ["get", "submit"]) {
    const response = res();
    await handlers[name]({ params: { id: orderId }, user: { _id: "other-user" }, body: upi }, response);
    assert.equal(response.statusCode, 404);
  }
  assert.equal(writes, 0);
});
test("customer submission stores encrypted details and audits only the method", async () => {
  let saved, audit;
  const handlers = refundDetailsHandlers({ orders: { findOne: async () => pending(), updateOne: async () => ({ matchedCount: 1 }) }, destinations: { findOneAndUpdate: async (_filter, update) => { saved = update.$set; return { ...saved, updatedAt: new Date() }; } }, audit: async (event) => { audit = event; } });
  const response = res();
  await handlers.submit({ params: { id: orderId }, user: { _id: userId }, body: upi }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(decryptRefundDestination(saved.encryptedDetails), upi);
  assert.equal(JSON.stringify(response.body).includes(upi.upiId), false);
  assert.deepEqual(audit.metadata, { method: "UPI" });
});
test("online and completed refunds reject destination submission", async () => {
  for (const changes of [{ paymentMethod: "Online" }, { status: "Refunded" }]) {
    const handlers = refundDetailsHandlers({ orders: { findOne: async () => ({ ...pending(), ...changes }) } });
    const response = res();
    await handlers.submit({ params: { id: orderId }, user: { _id: userId }, body: upi }, response);
    assert.equal(response.statusCode, 409);
  }
});
test("only platform administrators can reveal refund details", () => {
  for (const user of [{ accountType: "customer" }, { accountType: "seller", isAdmin: true }]) {
    const response = res(); let allowed = false;
    admin({ user }, response, () => { allowed = true; });
    assert.equal(response.statusCode, 403); assert.equal(allowed, false);
  }
});
test("successful request emails are sent once and failed delivery can be retried", async () => {
  const order = pending(); let attempts = 0; let deliver = false;
  const model = {
    findOneAndUpdate: async () => {
      if (order.refund.detailsEmailSentAt || (order.refund.detailsEmailAttemptedAt && Date.now() - order.refund.detailsEmailAttemptedAt < 60_000)) return null;
      order.refund.detailsEmailAttemptedAt = Date.now(); return order;
    },
    updateOne: async (_filter, update) => { for (const [path, value] of Object.entries(update.$set)) order.refund[path.split(".")[1]] = value; },
  };
  const send = async () => { attempts++; return { sent: deliver }; };
  assert.equal((await notifyRefundDetails(order, { model, send })).sent, false);
  assert.equal(order.refund.detailsEmailFailed, true);
  order.refund.detailsEmailAttemptedAt -= 61_000; deliver = true;
  assert.equal((await notifyRefundDetails(order, { model, send })).sent, true);
  assert.equal(order.refund.detailsEmailFailed, false);
  assert.equal((await notifyRefundDetails(order, { model, send })).skipped, true);
  assert.equal(attempts, 2);
});
