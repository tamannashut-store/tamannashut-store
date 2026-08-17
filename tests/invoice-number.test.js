import test from "node:test";
import assert from "node:assert/strict";
import { formatInvoiceNumber, invoiceFinancialYear } from "../server/src/utils/invoiceNumber.js";

test("invoice financial year changes on 1 April", () => {
  assert.equal(invoiceFinancialYear(new Date("2026-03-31T10:00:00+05:30")), "25-26");
  assert.equal(invoiceFinancialYear(new Date("2026-04-01T10:00:00+05:30")), "26-27");
});

test("invoice serial remains within the 16 character GST limit", () => {
  const invoice = formatInvoiceNumber("26-27", 42);
  assert.equal(invoice, "TH/26-27/000042");
  assert.ok(invoice.length <= 16);
});
