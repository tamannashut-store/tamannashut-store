import test from "node:test";
import assert from "node:assert/strict";
import {
  isRetryableRequestError,
  requestWithRetry,
} from "../client/src/utils/retryRequest.js";

test("requestWithRetry retries temporary failures and returns the successful response", async () => {
  let calls = 0;
  const retryAttempts = [];

  const result = await requestWithRetry(async () => {
    calls += 1;
    if (calls < 3) throw Object.assign(new Error("temporarily unavailable"), { response: { status: 503 } });
    return { data: { products: [{ id: "product-1" }] } };
  }, {
    attempts: 3,
    delays: [0, 0],
    onRetry: (attempt) => retryAttempts.push(attempt),
  });

  assert.equal(calls, 3);
  assert.deepEqual(retryAttempts, [1, 2]);
  assert.equal(result.data.products[0].id, "product-1");
});

test("requestWithRetry does not retry permanent client errors", async () => {
  let calls = 0;
  await assert.rejects(
    requestWithRetry(async () => {
      calls += 1;
      throw Object.assign(new Error("not found"), { response: { status: 404 } });
    }, { attempts: 3, delays: [0, 0] }),
    /not found/
  );
  assert.equal(calls, 1);
});

test("network and gateway failures are retryable but canceled requests are not", () => {
  assert.equal(isRetryableRequestError(new Error("network unavailable")), true);
  assert.equal(isRetryableRequestError({ response: { status: 504 } }), true);
  assert.equal(isRetryableRequestError({ response: { status: 400 } }), false);
  assert.equal(isRetryableRequestError({ code: "ERR_CANCELED" }), false);
});
