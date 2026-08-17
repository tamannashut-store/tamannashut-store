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

test("pending sellers cannot enter Seller Centre before verification", () => {
  assert.equal(loginPortalError({ accountType: "seller", sellerAccessStatus: "pending" }, true), "Your Seller Centre access is awaiting business verification");
});

test("marketplace sellers cannot use the customer portal", () => {
  assert.equal(loginPortalError({ accountType: "seller", sellerAccessStatus: "active" }, false), "Seller Centre accounts must sign in through Seller Centre");
});
