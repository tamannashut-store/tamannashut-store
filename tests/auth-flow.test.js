import test from "node:test";
import assert from "node:assert/strict";
import { passwordPolicyError } from "../server/src/utils/passwordPolicy.js";
import { isRateLimitedAuthRequest } from "../server/src/utils/authRateLimit.js";
import { accountTypeFromUser, homeForAccount, signInForAccount } from "../client/src/utils/accountSession.js";
import { createEmailVerification, createTwoFactorCode, hashAuthSecret, maskEmail, safeSecretEqual } from "../server/src/utils/authSecurity.js";
import { normalizeIndianPhone, phoneLookupValues } from "../server/src/utils/phone.js";

test("password policy accepts strong passwords and rejects weak values", () => {
  assert.equal(passwordPolicyError("SecureShop42"), "");
  assert.match(passwordPolicyError("password123"), /common/i);
  assert.match(passwordPolicyError("onlyletters"), /letter and one number/i);
  assert.match(passwordPolicyError("1234567890"), /letter and one number/i);
});

test("auth throttling targets public credential endpoints only", () => {
  assert.equal(isRateLimitedAuthRequest("POST", "/login"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/reset-password/token"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/verify-email"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/admin-login/verify"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/phone-verification/send"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/phone-verification/check"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/seller-invitations/token/accept"), true);
  assert.equal(isRateLimitedAuthRequest("GET", "/seller/profile"), false);
  assert.equal(isRateLimitedAuthRequest("PUT", "/change-password"), false);
  assert.equal(isRateLimitedAuthRequest("POST", "/seller-invitations"), false);
});

test("Indian customer phone numbers normalize to one promotion identity", () => {
  assert.equal(normalizeIndianPhone("98765 43210"), "+919876543210");
  assert.equal(normalizeIndianPhone("+91-98765-43210"), "+919876543210");
  assert.equal(normalizeIndianPhone("12345"), "");
  assert.deepEqual(phoneLookupValues("+919876543210"), ["+919876543210", "919876543210", "9876543210"]);
});

test("account routing keeps customer, seller and administrator portals separate", () => {
  assert.equal(accountTypeFromUser({}), "customer");
  assert.equal(homeForAccount({ isAdmin: true }), "/admin/dashboard");
  assert.equal(homeForAccount({ accountType: "seller", sellerAccessStatus: "pending" }), "/seller/profile");
  assert.equal(homeForAccount({ accountType: "seller", sellerAccessStatus: "active" }), "/seller/dashboard");
  assert.equal(signInForAccount({ accountType: "seller" }), "/admin-login");
  assert.equal(signInForAccount({ accountType: "customer" }), "/login");
});

test("email verification and two-factor secrets are random, hashed and safely comparable", () => {
  const verification = createEmailVerification(0);
  assert.equal(verification.token.length, 64);
  assert.equal(verification.tokenHash, hashAuthSecret(verification.token));
  assert.equal(verification.expiresAt.getTime(), 24 * 60 * 60 * 1000);
  const factor = createTwoFactorCode(0);
  assert.match(factor.code, /^\d{6}$/);
  assert.equal(factor.codeHash, hashAuthSecret(factor.code));
  assert.equal(factor.expiresAt.getTime(), 10 * 60 * 1000);
  assert.equal(safeSecretEqual(factor.codeHash, hashAuthSecret(factor.code)), true);
  assert.equal(safeSecretEqual(factor.codeHash, hashAuthSecret("000000")), false);
  assert.equal(maskEmail("seller@example.com"), "se****@example.com");
});
