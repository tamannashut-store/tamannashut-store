import test from "node:test";
import assert from "node:assert/strict";
import { passwordPolicyError } from "../server/src/utils/passwordPolicy.js";
import { isRateLimitedAuthRequest } from "../server/src/utils/authRateLimit.js";
import { accountTypeFromUser, homeForAccount, signInForAccount } from "../client/src/utils/accountSession.js";

test("password policy accepts strong passwords and rejects weak values", () => {
  assert.equal(passwordPolicyError("SecureShop42"), "");
  assert.match(passwordPolicyError("password123"), /common/i);
  assert.match(passwordPolicyError("onlyletters"), /letter and one number/i);
  assert.match(passwordPolicyError("1234567890"), /letter and one number/i);
});

test("auth throttling targets public credential endpoints only", () => {
  assert.equal(isRateLimitedAuthRequest("POST", "/login"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/reset-password/token"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/seller-invitations/token/accept"), true);
  assert.equal(isRateLimitedAuthRequest("GET", "/seller/profile"), false);
  assert.equal(isRateLimitedAuthRequest("PUT", "/change-password"), false);
  assert.equal(isRateLimitedAuthRequest("POST", "/seller-invitations"), false);
});

test("account routing keeps customer, seller and administrator portals separate", () => {
  assert.equal(accountTypeFromUser({}), "customer");
  assert.equal(homeForAccount({ isAdmin: true }), "/admin/dashboard");
  assert.equal(homeForAccount({ accountType: "seller", sellerAccessStatus: "pending" }), "/seller/profile");
  assert.equal(homeForAccount({ accountType: "seller", sellerAccessStatus: "active" }), "/seller/dashboard");
  assert.equal(signInForAccount({ accountType: "seller" }), "/admin-login");
  assert.equal(signInForAccount({ accountType: "customer" }), "/login");
});
