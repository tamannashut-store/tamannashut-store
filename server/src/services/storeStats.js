// Customer identifiers stay inside the aggregation; only totals are public.
export async function getStoreStats(Order, User, now = new Date()) {
  const [orders, registeredCustomers, activeBags] = await Promise.all([Order.aggregate([
    { $match: { status: "Delivered", paymentStatus: "Paid", userId: { $ne: null },
      $or: [{ "refund.amount": { $exists: false } }, { "refund.amount": 0 }] } },
    { $group: { _id: "$userId", orders: { $sum: 1 } } },
    { $group: { _id: null, deliveredOrders: { $sum: "$orders" }, customersServed: { $sum: 1 } } },
    { $project: { _id: 0, deliveredOrders: 1, customersServed: 1 } },
  ]).option({ maxTimeMS: 5000 }),
  User.countDocuments({ accountType: "customer", isAdmin: { $ne: true } }).maxTimeMS(5000),
  User.countDocuments({ accountType: "customer", isAdmin: { $ne: true }, "cart.0": { $exists: true },
    cartUpdatedAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), $lte: now },
  }).maxTimeMS(5000)]);
  const totals = orders[0];
  return { deliveredOrders: totals?.deliveredOrders || 0, customersServed: totals?.customersServed || 0, registeredCustomers, activeBags };
}
