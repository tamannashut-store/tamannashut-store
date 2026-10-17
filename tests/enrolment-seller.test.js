import test from "node:test";
import assert from "node:assert/strict";
import { calculateInvoiceTotals, invoiceTemplate } from "../server/src/utils/invoiceTemplate.js";
import { ENROLMENT_SELLER_ID, enrolmentTradingApproved, assertEnrolmentDestination } from "../server/src/utils/enrolmentSeller.js";
const profile = () => ({ userId: ENROLMENT_SELLER_ID, legalBusinessName: "Example proprietor", tradeName: "Example store", businessType: "proprietorship", businessPhone: "9000000000", authorizedSignatoryName: "Example owner", panLast4: "123A", bankAccountHolder: "Example owner", bankAccountLast4: "1234", ifscLast4: "1234", declarationsAcceptedAt: new Date(), verificationStatus: "pending", enrolment: { enabled: true, numberEncrypted: "encrypted", reviewedBy: "owner", reviewedAt: new Date(), eligibilityConfirmed: true, state: "West Bengal" }, registeredAddress: { line1: "Example street", city: "Howrah", pincode: "711302", state: "West Bengal" }, pickupAddress: { line1: "Example street", city: "Howrah", pincode: "711302", state: "West Bengal" }, bankVerification: { status: "verified" }, bankProof: { digest: "digest", uploadedAt: new Date() } });
test("enrolment exception is confined to the approved account and reviewed bank proof", () => {
  assert.equal(enrolmentTradingApproved(profile()), true);
  for (const changed of [{ userId: "another-account" }, { bankProof: {} }, { bankVerification: { status: "pending" } }, { pickupAddress: { state: "Bihar" } }, { closure: { status: "closed" } }]) assert.equal(enrolmentTradingApproved({ ...profile(), ...changed }), false);
});
test("restricted seller rejects interstate and unknown destinations", () => {
  assert.doesNotThrow(() => assertEnrolmentDestination(profile(), "West Bengal"));
  for (const state of ["Bihar", "", undefined]) assert.throws(() => assertEnrolmentDestination(profile(), state), { status: 400 });
  const unreviewed = profile(); unreviewed.enrolment.eligibilityConfirmed = false;
  assert.throws(() => assertEnrolmentDestination(unreviewed, "West Bengal"), { status: 409 });
});

test("enrolment receipt retains zero GST and supplier identity", () => {
  const order = { _id: "example", createdAt: new Date(), state: "West Bengal", totalAmount: 500, products: [{ name: "Example item", price: 500, qty: 1, gstRate: 0 }], enrolmentSupplier: { name: "Example store", legalName: "Example owner", address: "Example street" } };
  assert.equal(calculateInvoiceTotals(order).tax, 0);
  const html = invoiceTemplate(order);
  assert.match(html, /ORDER RECEIPT/);
  assert.match(html, /Example store/);
  assert.match(html, /GST has not been charged/);
  assert.doesNotMatch(html, /TAX INVOICE/);
});
