import test from "node:test";
import assert from "node:assert/strict";
import { accountTypeFor, hasActiveSellerCentreAccess, isMarketplaceSeller, isPlatformAdmin, scopeSellerOwned } from "../server/src/utils/accountRoles.js";

test("legacy invited seller is never treated as a platform administrator", () => {
  const legacySeller = { isAdmin: true, sellerRole: "member", sellerAccessStatus: "active" };
  assert.equal(accountTypeFor(legacySeller), "seller");
  assert.equal(isPlatformAdmin(legacySeller), false);
  assert.equal(isMarketplaceSeller(legacySeller), true);
});

test("only active sellers can enter Seller Centre", () => {
  assert.equal(hasActiveSellerCentreAccess({ accountType: "seller", sellerAccessStatus: "pending" }), false);
  assert.equal(hasActiveSellerCentreAccess({ accountType: "seller", sellerAccessStatus: "active" }), true);
});

test("platform administrator remains distinct from seller", () => {
  assert.equal(isPlatformAdmin({ accountType: "platform_admin", isAdmin: true }), true);
  assert.equal(isMarketplaceSeller({ accountType: "platform_admin", isAdmin: true }), false);
});

test("seller-owned database filters cannot access another seller's records", () => {
  const seller = { _id: "seller-a", accountType: "seller" };
  assert.deepEqual(scopeSellerOwned(seller, { status: "active" }), { status: "active", sellerId: "seller-a" });
  assert.deepEqual(scopeSellerOwned({ _id: "owner", accountType: "platform_admin" }, { status: "active" }), { status: "active" });
});
