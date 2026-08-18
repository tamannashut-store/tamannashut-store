import test from "node:test";
import assert from "node:assert/strict";
import { desiredSettlementStatus, fulfillmentStatusForOrder, groupSellerLines, settlementAmounts, settlementSummary } from "../server/src/services/sellerSettlementService.js";

const sellerA = "507f1f77bcf86cd799439011";
const sellerB = "507f1f77bcf86cd799439012";
const order = {
  subtotal: 1000, discount: 100, totalAmount: 900, status: "Pending", refund: {},
  products: [
    { sellerId: sellerA, name: "A", lineTotal: 600, qty: 2 },
    { sellerId: sellerB, name: "B", lineTotal: 400, qty: 1 },
  ],
};

test("seller lines are isolated by owner", () => {
  const groups = groupSellerLines(order);
  assert.equal(groups.size, 2);
  assert.equal(groups.get(sellerA).length, 1);
  assert.equal(groups.get(sellerB)[0].name, "B");
});

test("discount and commission are allocated proportionally", () => {
  const result = settlementAmounts({ order, lines: [order.products[0]], percent: 10 });
  assert.deepEqual(result, { grossAmount: 600, allocatedDiscount: 60, netSalesAmount: 540, commissionPercent: 10, commissionAmount: 54, refundAmount: 0 });
});

test("settlement lifecycle holds returns and reverses terminal orders", () => {
  assert.equal(desiredSettlementStatus({ status: "Delivered", statusHistory: [{ status: "Delivered", createdAt: new Date(Date.now() - 8 * 86400000) }] }), "eligible");
  assert.equal(desiredSettlementStatus({ status: "Delivered", statusHistory: [{ status: "Delivered", createdAt: new Date() }] }), "pending");
  assert.equal(desiredSettlementStatus({ status: "Return Requested" }), "held");
  assert.equal(desiredSettlementStatus({ status: "Refunded" }, "paid"), "reversed");
  assert.equal(desiredSettlementStatus({ status: "Packed" }), "pending");
});

test("summary keeps settlement states separate", () => {
  assert.deepEqual(settlementSummary([{ status: "eligible", payableAmount: 486 }, { status: "paid", payableAmount: 200 }]), { total: 686, pending: 0, eligible: 486, held: 0, paid: 200, reversed: 0 });
});

test("seller fulfilment state follows the customer order safely", () => {
  assert.equal(fulfillmentStatusForOrder("Pending"), "pending");
  assert.equal(fulfillmentStatusForOrder("Packed"), "ready");
  assert.equal(fulfillmentStatusForOrder("Shipped"), "shipped");
  assert.equal(fulfillmentStatusForOrder("Delivered"), "delivered");
  assert.equal(fulfillmentStatusForOrder("Returned"), "returned");
  assert.equal(fulfillmentStatusForOrder("Cancelled"), "cancelled");
});
