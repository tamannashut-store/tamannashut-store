import test from "node:test";
import assert from "node:assert/strict";
import { loginPortalError } from "../server/src/utils/loginPortal.js";

test("customer login rejects administrator accounts", () => {
  assert.equal(loginPortalError({ isAdmin: true }, false), "Seller Centre accounts must sign in through Seller Centre");
});

test("Seller Centre rejects customer accounts", () => {
  assert.equal(loginPortalError({ isAdmin: false }, true), "This customer account does not have Seller Centre access");
});

test("each account type can use its intended portal", () => {
  assert.equal(loginPortalError({ isAdmin: false }, false), "");
  assert.equal(loginPortalError({ isAdmin: true }, true), "");
  assert.equal(loginPortalError({ accountType: "seller", sellerAccessStatus: "active" }, true), "");
});

test("pending sellers can sign in to the restricted profile correction area", () => {
  assert.equal(loginPortalError({ accountType: "seller", sellerAccessStatus: "pending" }, true), "");
});

test("closed and suspended sellers cannot sign in", () => {
  assert.match(loginPortalError({ accountType: "seller", sellerAccessStatus: "closed" }, true), /unavailable/);
  assert.match(loginPortalError({ accountType: "seller", sellerAccessStatus: "suspended" }, true), /unavailable/);
});

test("marketplace sellers cannot use the customer portal", () => {
  assert.equal(loginPortalError({ accountType: "seller", sellerAccessStatus: "active" }, false), "Seller Centre accounts must sign in through Seller Centre");
});
