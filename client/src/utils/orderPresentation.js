export function customerPaymentLabel(order) {
  if (order.paymentStatus === "Refunded" || order.status === "Refunded") return `${order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"} · Refunded`;
  if (order.paymentMethod !== "COD") return order.paymentStatus === "Paid" && order.paymentId ? "Paid online" : "Online payment · Confirmation pending";
  if (["Cancelled", "RTO Initiated", "RTO Delivered"].includes(order.status) || order.paymentStatus === "Not Collected") return "Cash on delivery · No payment collected";
  if (order.paymentStatus === "Paid" || ["Delivered", "Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending"].includes(order.status)) return "Cash collected on delivery";
  return "Cash on delivery · Payment pending";
}

export function returnWindow(order, now = Date.now()) {
  const delivered = [...(order.statusHistory || [])].reverse().find((entry) => entry.status === "Delivered");
  const deliveredAt = new Date(delivered?.createdAt).getTime();
  const deadline = Number.isFinite(deliveredAt) ? deliveredAt + 7 * 86400000 : null;
  return { deadline, closed: deadline !== null && now > deadline };
}
