import test from "node:test";
import assert from "node:assert/strict";
import { admin, seller, sellerCentre } from "../server/src/middleware/authMiddleware.js";

const response = () => {
  const state = { status: 200, body: null };
  return {
    state,
    status(code) { state.status = code; return this; },
    json(body) { state.body = body; return this; },
  };
};

test("legacy seller is blocked from platform-admin endpoints", () => {
  const res = response();
  let called = false;
  admin({ user: { isAdmin: true, sellerRole: "member", sellerAccessStatus: "active" } }, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.state.status, 403);
});

test("platform administrator can use admin endpoints", () => {
  let called = false;
  admin({ user: { accountType: "platform_admin", isAdmin: true } }, response(), () => { called = true; });
  assert.equal(called, true);
});

test("active seller can use seller-scoped endpoints only", () => {
  const user = { accountType: "seller", isAdmin: false, sellerAccessStatus: "active" };
  let sellerCalled = false;
  let centreCalled = false;
  seller({ user }, response(), () => { sellerCalled = true; });
  sellerCentre({ user }, response(), () => { centreCalled = true; });
  assert.equal(sellerCalled, true);
  assert.equal(centreCalled, true);
});

test("pending seller cannot use seller-scoped endpoints", () => {
  const res = response();
  let called = false;
  sellerCentre({ user: { accountType: "seller", sellerAccessStatus: "pending" } }, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.state.status, 403);
});
