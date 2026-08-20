import test from "node:test";
import assert from "node:assert/strict";
import { effectiveSellerVerification, normalizeSellerDetails, sellerProfileCompleteness } from "../server/src/utils/sellerOnboarding.js";

const validApplication = () => ({
  legalBusinessName: "Example Proprietor",
  tradeName: "Example Kids",
  businessType: "proprietorship",
  businessPhone: "9876543210",
  authorizedSignatoryName: "Example Owner",
  gstin: "19ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  registeredAddressLine1: "10 Market Road",
  registeredAddressCity: "Howrah",
  registeredAddressState: "West Bengal",
  registeredAddressPincode: "711310",
  pickupSameAsRegistered: true,
  bankAccountHolder: "Example Proprietor",
  bankAccountType: "current",
  bankAccountNumber: "1234567890",
  confirmBankAccountNumber: "1234567890",
  ifsc: "ABCD0123456",
  gstDeclaration: true,
  bankDeclaration: true,
  termsAccepted: true,
});

test("seller onboarding requires complete business, address and settlement details", () => {
  const result = normalizeSellerDetails(validApplication());
  assert.equal(result.tradeName, "Example Kids");
  assert.equal(result.pickupAddress.pincode, "711310");
  assert.equal(result.bankAccountType, "current");
});

test("seller onboarding rejects mismatched bank account confirmation", () => {
  const application = validApplication();
  application.confirmBankAccountNumber = "1234567891";
  assert.throws(() => normalizeSellerDetails(application), /Bank account numbers do not match/);
});

test("seller onboarding rejects PAN that does not match GSTIN", () => {
  const application = validApplication();
  application.pan = "AAAAA1111A";
  assert.throws(() => normalizeSellerDetails(application), /PAN must match/);
});

const completedProfile = () => ({
  legalBusinessName: "Example Proprietor", tradeName: "Example Kids", businessType: "proprietorship",
  businessPhone: "9876543210", authorizedSignatoryName: "Example Owner",
  registeredAddress: { line1: "10 Market Road", city: "Howrah", state: "West Bengal", pincode: "711310" },
  pickupAddress: { line1: "10 Market Road", city: "Howrah", state: "West Bengal", pincode: "711310" },
  gstinLast4: "F1Z5", panLast4: "234F", bankAccountHolder: "Example Proprietor", bankAccountLast4: "7890", ifscLast4: "3456",
  declarationsAcceptedAt: new Date(), verificationStatus: "verified",
  gstVerification: { status: "verified" }, bankVerification: { status: "verified" },
});

test("legacy verified sellers are not treated as compliant when required fields are missing", () => {
  const profile = completedProfile();
  profile.registeredAddress = {};
  profile.bankVerification.status = "pending";
  const result = effectiveSellerVerification(profile);
  assert.equal(result.status, "needs_update");
  assert.ok(result.missingFields.includes("Registered address"));
});

test("complete KYC with both manual checks is effectively verified", () => {
  assert.deepEqual(sellerProfileCompleteness(completedProfile()), { complete: true, missingFields: [] });
  assert.equal(effectiveSellerVerification(completedProfile()).status, "verified");
});
