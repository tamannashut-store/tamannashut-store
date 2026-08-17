const SELLER_STATE = "West Bengal";
const normalizeState = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z]/g, "");

export const gstRateForApparelUnit = (unitTransactionValue) => Number(unitTransactionValue || 0) <= 2500 ? 5 : 18;

export const calculateApparelGst = (order) => {
  const products = Array.isArray(order.products) ? order.products : [];
  const itemSubtotal = Number(order.subtotal ?? products.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0));
  const discount = Math.min(Math.max(Number(order.discount || 0), 0), itemSubtotal);
  const total = Number(order.totalAmount ?? Math.max(0, itemSubtotal - discount));
  const discountRatio = itemSubtotal > 0 ? discount / itemSubtotal : 0;
  const lines = products.map((item) => {
    const qty = Math.max(Number(item.qty || 0), 0);
    const gross = Number(item.price || 0) * qty;
    const inclusiveValue = gross * (1 - discountRatio);
    const unitTransactionValue = qty ? inclusiveValue / qty : 0;
    const storedRate = Number(item.gstRate);
    const rate = [5, 18].includes(storedRate) ? storedRate : gstRateForApparelUnit(unitTransactionValue);
    const taxable = inclusiveValue / (1 + rate / 100);
    const tax = inclusiveValue - taxable;
    return { ...item, hsnCode: String(item.hsnCode || "").trim(), rate, gross, inclusiveValue, taxable, tax };
  });
  const taxable = lines.reduce((sum, item) => sum + item.taxable, 0);
  const tax = lines.reduce((sum, item) => sum + item.tax, 0);
  const destinationState = String(order.state || SELLER_STATE).trim() || SELLER_STATE;
  const intraState = normalizeState(destinationState) === normalizeState(SELLER_STATE) || normalizeState(destinationState) === "wb";
  return { itemSubtotal, discount, total, taxable, tax, lines, intraState, destinationState, sellerState: SELLER_STATE, cgst: intraState ? tax / 2 : 0, sgst: intraState ? tax / 2 : 0, igst: intraState ? 0 : tax };
};
