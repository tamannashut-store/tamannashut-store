// Shiprocket shipment status IDs, not pickup-request or order status IDs.
export const courierStatus = (code, reverse = false) => reverse
  ? ({ 6: "Return Picked Up", 7: "Returned", 42: "Return Picked Up" })[Number(code)]
  : ({ 6: "Shipped", 7: "Delivered", 8: "Cancelled", 9: "RTO Initiated", 10: "RTO Delivered", 17: "Shipped", 18: "Shipped", 38: "Shipped", 42: "Shipped", 51: "Shipped" })[Number(code)];
export const courierProgress = (current, next, reverse = false) => {
  if (current === next || !next) return [];
  if (reverse) {
    if (current === "Return Approved" && next === "Returned") return ["Return Picked Up", "Returned"];
    if (current === "Return Approved" && next === "Return Picked Up") return [next];
    if (current === "Return Picked Up" && next === "Returned") return [next];
    return [];
  }
  if (["Confirmed", "Packed"].includes(current)) {
    if (next === "Delivered") return ["Shipped", "Delivered"];
    if (next === "Shipped") return [next];
  }
  if (current === "Shipped" && next === "Delivered") return [next];
  return [];
};
