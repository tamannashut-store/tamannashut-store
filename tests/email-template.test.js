import test from "node:test";
import assert from "node:assert/strict";
import { adminNewOrderEmailTemplate, contactAdminEmailTemplate, contactCustomerEmailTemplate, emailVerificationTemplate, orderEmailTemplate, passwordResetEmailTemplate, sellerInvitationEmailTemplate, supportFollowUpEmailTemplate, supportReplyEmailTemplate, twoFactorCodeEmailTemplate } from "../server/src/utils/emailTemplates.js";

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

test("account verification and Seller Centre codes use branded secure emails", () => {
  const verification = emailVerificationTemplate({ name: "New Customer" }, "https://www.tamannashut.com/verify-email/token");
  assert.match(verification, /Verify email address/);
  assert.match(verification, /expires in 24 hours/i);
  const factor = twoFactorCodeEmailTemplate({ name: "Seller" }, "123456");
  assert.match(factor, /TWO-STEP VERIFICATION/);
  assert.match(factor, /123456/);
  assert.match(factor, /10 minutes/i);
});

test("support emails include a safe customer reference and structured context", () => {
  const customer = contactCustomerEmailTemplate("Test Parent", "B06F8E07");
  assert.match(customer, /B06F8E07/);
  assert.match(customer, /1–2 business days/);

  const admin = contactAdminEmailTemplate({ name: "<Parent>", email: "test@example.com", topic: "Order support", orderReference: "ORDER-123", message: "Please <check> this order", reference: "B06F8E07" });
  assert.match(admin, /Order support/);
  assert.match(admin, /ORDER-123/);
  assert.doesNotMatch(admin, /<Parent>|<check>/);
});

test("support conversation emails escape replies and link to the correct workspace", () => {
  const customer = supportReplyEmailTemplate({ name: "<Parent>", reference: "B06F8E07", reply: "Please <confirm> delivery." });
  assert.match(customer, /View support request/);
  assert.match(customer, /\/support/);
  assert.doesNotMatch(customer, /<Parent>|<confirm>/);

  const admin = supportFollowUpEmailTemplate({ name: "<Parent>", email: "test@example.com", reference: "B06F8E07", message: "My <reply>" });
  assert.match(admin, /Open support inbox/);
  assert.match(admin, /\/admin\/contacts/);
  assert.doesNotMatch(admin, /<Parent>|<reply>/);
});
