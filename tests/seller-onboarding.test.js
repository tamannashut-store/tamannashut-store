import test from "node:test";
import assert from "node:assert/strict";
import { decryptSellerValue, encryptedSellerProfile, normalizeSellerDetails } from "../server/src/utils/sellerOnboarding.js";

const previousKey = process.env.SELLER_DATA_ENCRYPTION_KEY;
process.env.SELLER_DATA_ENCRYPTION_KEY = "test-only-encryption-key-that-is-long-enough";
test.after(() => { if (previousKey === undefined) delete process.env.SELLER_DATA_ENCRYPTION_KEY; else process.env.SELLER_DATA_ENCRYPTION_KEY = previousKey; });

const validDetails = { legalBusinessName: "Tamanna Enterprise", gstin: "19BKDPB6636D1ZE", pan: "BKDPB6636D", bankAccountHolder: "Tamanna Enterprise", bankAccountNumber: "123456789012", ifsc: "SBIN0001234" };

test("seller GST, PAN and bank formats are normalized consistently", () => {
  const normalized = normalizeSellerDetails({ ...validDetails, gstin: "19bKDPB6636d1ze", ifsc: "sbin0001234" });
  assert.equal(normalized.gstin, validDetails.gstin);
  assert.equal(normalized.ifsc, validDetails.ifsc);
});

test("seller bank and tax identifiers are encrypted at rest", () => {
  const profile = encryptedSellerProfile(normalizeSellerDetails(validDetails));
  assert.doesNotMatch(profile.bankAccountEncrypted, /123456789012/);
  assert.equal(decryptSellerValue(profile.bankAccountEncrypted), "123456789012");
  assert.equal(decryptSellerValue(profile.gstinEncrypted), validDetails.gstin);
  assert.equal(profile.bankAccountLast4, "9012");
});

test("GSTIN must contain the submitted PAN", () => {
  assert.throws(() => normalizeSellerDetails({ ...validDetails, pan: "ABCDE1234F" }), /PAN must match/);
});
