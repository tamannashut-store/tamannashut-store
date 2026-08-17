import test from "node:test";
import assert from "node:assert/strict";
import { loginPortalError } from "../server/src/utils/loginPortal.js";

test("customer login rejects administrator accounts", () => {
  assert.equal(loginPortalError({ isAdmin: true }, false), "Administrator accounts must sign in through Seller Centre");
});

test("Seller Centre rejects customer accounts", () => {
  assert.equal(loginPortalError({ isAdmin: false }, true), "This customer account does not have Seller Centre access");
});

test("each account type can use its intended portal", () => {
  assert.equal(loginPortalError({ isAdmin: false }, false), "");
  assert.equal(loginPortalError({ isAdmin: true }, true), "");
});

test("pending sellers cannot enter Seller Centre before verification", () => {
  assert.equal(loginPortalError({ isAdmin: true, sellerAccessStatus: "pending" }, true), "Your Seller Centre access is awaiting business verification");
});
