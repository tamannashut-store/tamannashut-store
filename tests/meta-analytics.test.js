import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function harness() {
  const calls = [];
  const storage = new Map();
  const context = {
    window: { fbq: (...args) => calls.push(args), gtag: () => {}, addEventListener() {}, removeEventListener() {}, setTimeout() {} },
    document: { readyState: "complete", createElement: () => ({}), head: { appendChild() {} } },
    sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  };
  vm.createContext(context);
  const source = fs.readFileSync(new URL("../client/src/utils/analytics.js", import.meta.url), "utf8");
  vm.runInContext(source.replace("export const trackEvent", "globalThis.trackEvent"), context);
  return { calls, track: context.trackEvent };
}

test("product and checkout events initialize the new dataset first and exclude customer details", () => {
  const { calls, track } = harness();
  track("view_item", { value: 649, email: "private@example.com", items: [{ item_id: "kurti", price: 649 }] });
  track("begin_checkout", { value: 1298, items: [{ item_id: "kurti", price: 649, quantity: 2 }] });
  assert.deepEqual(calls[0], ["init", "1137463968714611"]);
  assert.equal(calls[1][1], "PageView");
  assert.equal(calls[2][1], "ViewContent");
  assert.equal(calls[3][1], "InitiateCheckout");
  assert.equal(calls[3][2].contents[0].quantity, 2);
  assert.equal(JSON.stringify(calls).includes("private@example.com"), false);
});

test("confirmed purchases use order-specific event IDs and suppress repeated Meta reports", () => {
  const { calls, track } = harness();
  const order = { value: 699, transaction_id: "order-1", items: [{ item_id: "kurti", price: 699, quantity: 1 }] };
  track("purchase", order);
  track("purchase", order);
  track("purchase", { ...order, transaction_id: "order-2" });
  const purchases = calls.filter((call) => call[1] === "Purchase");
  assert.equal(purchases.length, 2);
  assert.equal(purchases[0][3].eventID, "purchase_order-1");
  assert.equal(purchases[1][3].eventID, "purchase_order-2");
});
