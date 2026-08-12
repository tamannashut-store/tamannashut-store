export const ORDER_STATUSES = [
  "Pending", "Processing", "Confirmed", "Packed", "Shipped", "Delivered",
  "Cancellation Requested", "Cancelled", "Return Requested", "Return Approved",
  "Return Picked Up", "Returned", "Refund Pending", "Refunded", "RTO Initiated", "RTO Delivered",
];

const transitions = {
  Pending: ["Confirmed", "Cancelled"],
  Processing: ["Confirmed", "Packed", "Cancelled"],
  Confirmed: ["Packed", "Cancellation Requested", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "RTO Initiated"],
  Delivered: ["Return Requested"],
  "Cancellation Requested": ["Cancelled", "Confirmed"],
  "Return Requested": ["Return Approved", "Delivered"],
  "Return Approved": ["Return Picked Up"],
  "Return Picked Up": ["Returned"],
  Returned: ["Refund Pending"],
  "Refund Pending": ["Refunded"],
  "RTO Initiated": ["RTO Delivered"],
  "RTO Delivered": ["Refund Pending", "Cancelled"],
  Cancelled: ["Refund Pending"], Refunded: [],
};

export const canTransitionOrder = (current, next) => current === next || (transitions[current] || []).includes(next);
export const shouldRecordOrderTransition = (current, next) => Boolean(next) && current !== next && canTransitionOrder(current, next);
export const getNextOrderStatuses = (current) => transitions[current] || [];
export const restoresStockAt = new Set(["Cancelled", "Returned", "RTO Delivered"]);

export const syncCodPaymentStatus = (order, nextStatus) => {
  if (!order || order.paymentMethod !== "COD" || order.paymentStatus === "Refunded") return order?.paymentStatus;
  if (nextStatus === "Delivered") order.paymentStatus = "Paid";
  else if (["Cancelled", "RTO Initiated", "RTO Delivered"].includes(nextStatus)) order.paymentStatus = "Not Collected";
  return order.paymentStatus;
};
