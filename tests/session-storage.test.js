import test from "node:test";
import assert from "node:assert/strict";
import { isExpiredJwt } from "../client/src/utils/storage.js";

const tokenWithExpiry = (exp) => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode({ exp })}.signature`;
};

test("expired JWT sessions are recognized before application startup", () => {
  assert.equal(isExpiredJwt(tokenWithExpiry(100), 101000), true);
});

test("unexpired JWT sessions remain available", () => {
  assert.equal(isExpiredJwt(tokenWithExpiry(102), 101000), false);
});

test("opaque development tokens are left for server validation", () => {
  assert.equal(isExpiredJwt("safe-local-token", 101000), false);
});
