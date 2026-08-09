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
  Cancelled: [], Refunded: [],
};

export const canTransitionOrder = (current, next) => current === next || (transitions[current] || []).includes(next);
export const getNextOrderStatuses = (current) => transitions[current] || [];
export const restoresStockAt = new Set(["Cancelled", "Returned", "RTO Delivered"]);
