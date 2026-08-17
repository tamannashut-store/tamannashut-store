import test from "node:test";
import assert from "node:assert/strict";
import { adminNewOrderEmailTemplate, orderEmailTemplate, passwordResetEmailTemplate, sellerInvitationEmailTemplate } from "../server/src/utils/emailTemplates.js";

const baseOrder = {
  _id: "order-123",
  customerName: "Test Parent",
  totalAmount: 299,
  status: "Pending",
  products: [{ name: "Baby Outfit", selectedColor: "Maroon", selectedSize: "0-3M", qty: 1 }],
};

test("COD confirmation email says that payment has not been collected", () => {
  const html = orderEmailTemplate({ ...baseOrder, paymentMethod: "COD", paymentStatus: "Pending" });
  assert.match(html, /Cash on Delivery/);
  assert.match(html, /No payment has been collected/);
  assert.doesNotMatch(html, /online payment has been verified/i);
});

test("verified online confirmation email confirms payment", () => {
  const html = orderEmailTemplate({ ...baseOrder, paymentMethod: "Online", paymentStatus: "Paid", paymentId: "pay_verified" });
  assert.match(html, /Paid Online/);
  assert.match(html, /online payment has been verified/i);
});

test("transactional email escapes customer and catalogue HTML", () => {
  const html = orderEmailTemplate({ ...baseOrder, customerName: "<script>alert(1)</script>", paymentMethod: "COD", products: [{ ...baseOrder.products[0], name: "<img src=x onerror=alert(1)>" }] });
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
});

test("password reset email uses the branded secure layout and escapes content", () => {
  const html = passwordResetEmailTemplate({ name: "<Admin>" }, "https://www.tamannashut.com/reset-password/token");
  assert.match(html, /ACCOUNT SECURITY/);
  assert.match(html, /Create new password/);
  assert.match(html, /HUT OF PURITY/);
  assert.doesNotMatch(html, /<Admin>/);
});

test("seller order alert has a useful inbox preview", () => {
  const html = adminNewOrderEmailTemplate({ ...baseOrder, _id: "6a837939a75b0eb2b068fe07", paymentMethod: "COD", paymentStatus: "Pending" });
  assert.match(html, /Order #B068FE07 from Test Parent/);
  assert.match(html, /A new order is ready/);
});

test("seller invitation explains verification and expiry", () => {
  const html = sellerInvitationEmailTemplate("https://www.tamannashut.com/seller/register/token");
  assert.match(html, /Complete seller onboarding/);
  assert.match(html, /expires in 48 hours/i);
  assert.match(html, /access remains locked/i);
});
