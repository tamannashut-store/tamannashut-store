// Customer identifiers stay inside the aggregation; only totals are public.
export async function getStoreStats(Order) {
  const [totals] = await Order.aggregate([
    { $match: { status: "Delivered", paymentStatus: "Paid", userId: { $ne: null },
      $or: [{ "refund.amount": { $exists: false } }, { "refund.amount": 0 }] } },
    { $group: { _id: "$userId", orders: { $sum: 1 } } },
    { $group: { _id: null, deliveredOrders: { $sum: "$orders" }, customersServed: { $sum: 1 } } },
    { $project: { _id: 0, deliveredOrders: 1, customersServed: 1 } },
  ]).option({ maxTimeMS: 5000 });
  return { deliveredOrders: totals?.deliveredOrders || 0, customersServed: totals?.customersServed || 0 };
}
