import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { generateSettlementStatement } from "../server/src/utils/generateSettlementStatement.js";

test("seller settlement statement renders a valid PDF", async () => {
  const response = new PassThrough();
  response.setHeader = () => {};
  const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => response.on("finish", resolve).on("error", reject));
  generateSettlementStatement({
    _id: "66ab1234fedcba9876543210",
    sellerId: { name: "Test Seller", email: "seller@example.com" },
    orderId: { _id: "66ab1234fedcba9876543999", status: "Delivered", invoiceNumber: "TH-26-123" },
    status: "paid", grossAmount: 1000, allocatedDiscount: 100, netSalesAmount: 900,
    commissionPercent: 10, commissionAmount: 90, refundAmount: 0, adjustmentAmount: -20,
    payableAmount: 790, paymentMethod: "Bank transfer", paymentReference: "UTR123456",
    adjustments: [{ category: "shipping", amount: -20, note: "Seller shipping contribution" }],
  }, response);
  await completed;
  const pdf = Buffer.concat(chunks);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 2_000);
});
