const noCollectionStatuses = new Set(["Cancelled", "RTO Initiated", "RTO Delivered"]);
const collectedCodStatuses = new Set(["Delivered", "Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending"]);

export const effectivePaymentStatus = (order = {}) => {
  if (order.paymentStatus === "Refunded" || order.status === "Refunded") return "Refunded";
  if (order.paymentMethod !== "COD") return order.paymentStatus === "Paid" && order.paymentId ? "Paid" : "Pending";
  if (noCollectionStatuses.has(order.status)) return "Not Collected";
  if (collectedCodStatuses.has(order.status)) return "Paid";
  return order.paymentStatus === "Not Collected" ? "Pending" : order.paymentStatus || "Pending";
};

export const paymentMethodLabel = (order = {}) => order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

export const paymentStatusLabel = (order = {}) => {
  const status = effectivePaymentStatus(order);
  if (status === "Paid" && order.paymentMethod === "COD") return "Collected on Delivery";
  if (status === "Paid") return "Paid Online";
  if (status === "Not Collected") return "No Payment Collected";
  return status;
};
