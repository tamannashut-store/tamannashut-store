import InvoiceCounter from "../models/InvoiceCounter.js";

export const invoiceFinancialYear = (date = new Date()) => {
  const value = new Date(date);
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric" }).formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
};

export const formatInvoiceNumber = (financialYear, sequence) => `TH/${financialYear}/${String(sequence).padStart(6, "0")}`;

export const nextInvoiceNumber = async (date = new Date()) => {
  const financialYear = invoiceFinancialYear(date);
  const counter = await InvoiceCounter.findOneAndUpdate(
    { _id: financialYear },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (counter.sequence > 999999) throw new Error("The annual invoice number series is exhausted");
  return formatInvoiceNumber(financialYear, counter.sequence);
};
