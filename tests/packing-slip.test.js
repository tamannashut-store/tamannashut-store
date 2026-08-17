import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { buildPackingSlipDocument } from "../server/src/utils/generatePackingSlip.js";

const sampleOrder = {
  _id: "66ab1234fedcba9876543210",
  createdAt: new Date("2026-08-18T09:30:00.000Z"),
  customerName: "Test Customer",
  phone: "9876543210",
  address: "12 Sample Road, Near Market",
  city: "Howrah",
  state: "West Bengal",
  pincode: "711310",
  paymentMethod: "COD",
  status: "Packed",
  shipping: { courierName: "Delhivery Surface", awbCode: "AWB123456", pickupScheduled: true },
  products: [{ name: "Baby Suspender Clothing Set", selectedColor: "Maroon", selectedSize: "9-12M", sku: "TH-MRN-9-12M", qty: 2 }],
};

test("packing slip renders a valid PDF", async () => {
  const doc = buildPackingSlipDocument(sampleOrder);
  const output = new PassThrough();
  const chunks = [];
  output.on("data", (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => output.on("finish", resolve).on("error", reject));
  doc.pipe(output);
  doc.end();
  await completed;
  const pdf = Buffer.concat(chunks);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 2_000);
});
