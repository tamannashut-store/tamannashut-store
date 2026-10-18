import test from "node:test";
import assert from "node:assert/strict";
import { matchesDeliveryState, deliveryStateMessage } from "../client/src/utils/deliveryStates.js";
test("restricted delivery never reports another or unknown state as eligible", () => {
  assert.equal(matchesDeliveryState(["West Bengal"], " west bengal "), true);
  for (const state of ["Bihar", "Delhi", "", undefined]) assert.equal(matchesDeliveryState(["West Bengal"], state), false);
  assert.equal(deliveryStateMessage(["West Bengal"]), "Delivery within West Bengal only");
  assert.equal(matchesDeliveryState([], "Delhi"), true);
});
