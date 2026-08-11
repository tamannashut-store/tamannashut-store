import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Contact from "../models/Contact.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

router.get("/notifications", protect, admin, async (_req, res) => {
  try {
    const [orders, reviewResult, messages] = await Promise.all([
      Order.countDocuments({ $or: [
        { status: { $in: ["Pending", "Cancellation Requested", "Return Requested", "Returned", "RTO Delivered"] } },
        { status: "Refund Pending", paymentMethod: "COD" },
        { "refund.status": "Failed" },
      ] }),
      Product.aggregate([
        { $unwind: "$reviews" },
        { $match: { "reviews.status": "pending" } },
        { $count: "count" },
      ]),
      Contact.countDocuments({ readAt: null }),
    ]);
    return res.json({ orders, reviews: reviewResult[0]?.count || 0, messages });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/operations", protect, admin, async (_req, res) => {
  try {
    const abandonedBefore = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [recentActivity, failedRefunds, pendingRefunds, abandonedCarts, recoveryEligible] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).limit(50).select("actorEmail action entityType entityId summary metadata createdAt").lean(),
      Order.countDocuments({ "refund.status": "Failed" }),
      Order.countDocuments({ "refund.status": "Pending" }),
      User.countDocuments({ "cart.0": { $exists: true }, cartUpdatedAt: { $lte: abandonedBefore } }),
      User.countDocuments({ "cart.0": { $exists: true }, cartUpdatedAt: { $lte: abandonedBefore }, marketingConsent: true }),
    ]);
    const configured = (...names) => names.every((name) => Boolean(String(process.env[name] || "").trim()));
    return res.json({
      services: [
        { key: "database", label: "MongoDB", ready: true, required: true },
        { key: "payments", label: "Razorpay payments", ready: configured("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"), required: true },
        { key: "shipping", label: "Shiprocket", ready: configured("SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_PICKUP_LOCATION", "SHIPROCKET_PICKUP_POSTCODE", "SHIPROCKET_WEBHOOK_SECRET"), required: true },
        { key: "images", label: "Cloudinary", ready: configured("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"), required: true },
        { key: "email", label: "Order email", ready: configured("RESEND_API_KEY", "EMAIL_FROM"), required: true },
        { key: "whatsapp", label: "Twilio WhatsApp", ready: configured("TWILIO_SID", "TWILIO_AUTH"), required: false },
        { key: "instagram", label: "Instagram feed", ready: configured("INSTAGRAM_ACCESS_TOKEN"), required: false },
        { key: "monitoring", label: "Sentry monitoring", ready: configured("SENTRY_DSN"), required: false },
      ],
      alerts: { failedRefunds, pendingRefunds, abandonedCarts, recoveryEligible },
      recentActivity,
      checkedAt: new Date(),
    });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/analytics", protect, admin, async (req, res) => {
  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 86400000);
    const previousStart = new Date(periodStart.getTime() - days * 86400000);
    const [orders, products, activeCartUsers, totalUsers] = await Promise.all([
      Order.find({ createdAt: { $gte: previousStart } }).select("userId customerName city products totalAmount discount couponCode paymentMethod paymentStatus status refund createdAt").sort({ createdAt: -1 }).limit(5000).lean(),
      Product.find({ status: { $nin: ["draft", "archived"] } }).select("name variants sizeStock lowStockThreshold status").lean(),
      User.countDocuments({ "cart.0": { $exists: true } }),
      User.countDocuments({ isAdmin: { $ne: true } }),
    ]);

    const currentOrders = orders.filter((order) => new Date(order.createdAt) >= periodStart);
    const previousOrders = orders.filter((order) => new Date(order.createdAt) < periodStart);
    const realized = (items) => items.filter((order) => order.status === "Delivered");
    const realizedRevenue = (items) => money(realized(items).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0));
    const currentRevenue = realizedRevenue(currentOrders);
    const previousRevenue = realizedRevenue(previousOrders);
    const currentDelivered = realized(currentOrders);
    const revenueChange = previousRevenue > 0 ? money(((currentRevenue - previousRevenue) / previousRevenue) * 100) : currentRevenue > 0 ? 100 : 0;
    const orderChange = previousOrders.length > 0 ? money(((currentOrders.length - previousOrders.length) / previousOrders.length) * 100) : currentOrders.length > 0 ? 100 : 0;

    const dailyMap = new Map();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(now.getTime() - index * 86400000);
      dailyMap.set(dayKey(date), { date: dayKey(date), revenue: 0, orders: 0 });
    }
    currentDelivered.forEach((order) => {
      const point = dailyMap.get(dayKey(order.createdAt));
      if (point) { point.revenue = money(point.revenue + Number(order.totalAmount || 0)); point.orders += 1; }
    });

    const statusMap = currentOrders.reduce((map, order) => map.set(order.status, (map.get(order.status) || 0) + 1), new Map());
    const paymentMap = currentOrders.reduce((map, order) => map.set(order.paymentMethod || "Unknown", (map.get(order.paymentMethod || "Unknown") || 0) + 1), new Map());
    const productMap = new Map();
    currentDelivered.forEach((order) => (order.products || []).forEach((item) => {
      const key = String(item._id || item.name);
      const current = productMap.get(key) || { productId: key, name: item.name || "Product", units: 0, revenue: 0 };
      current.units += Number(item.qty || 0);
      current.revenue = money(current.revenue + Number(item.lineTotal ?? Number(item.price || 0) * Number(item.qty || 0)));
      productMap.set(key, current);
    }));
    const couponMap = new Map();
    currentOrders.filter((order) => order.couponCode).forEach((order) => {
      const code = String(order.couponCode).toUpperCase();
      const current = couponMap.get(code) || { code, orders: 0, discount: 0, revenue: 0 };
      current.orders += 1; current.discount = money(current.discount + Number(order.discount || 0)); current.revenue = money(current.revenue + Number(order.totalAmount || 0)); couponMap.set(code, current);
    });
    const customerOrders = new Map();
    currentDelivered.forEach((order) => customerOrders.set(String(order.userId), (customerOrders.get(String(order.userId)) || 0) + 1));
    const repeatCustomers = [...customerOrders.values()].filter((count) => count > 1).length;
    const refunds = currentOrders.filter((order) => ["Processed", "Refunded"].includes(order.refund?.status));
    const lowStock = products.filter((product) => (product.variants?.length ? product.variants : product.sizeStock || []).some((item) => Number(item.stock || 0) <= Number(product.lowStockThreshold ?? 3))).length;

    return res.json({
      period: { days, from: periodStart, to: now },
      summary: {
        orders: currentOrders.length,
        orderChange,
        realizedRevenue: currentRevenue,
        revenueChange,
        averageOrderValue: currentDelivered.length ? money(currentRevenue / currentDelivered.length) : 0,
        deliveredOrders: currentDelivered.length,
        refunds: refunds.length,
        refundedAmount: money(refunds.reduce((sum, order) => sum + Number(order.refund?.amount || 0), 0)),
        repeatCustomerRate: customerOrders.size ? money((repeatCustomers / customerOrders.size) * 100) : 0,
        activeCustomerCarts: activeCartUsers,
        registeredCustomers: totalUsers,
        lowStockProducts: lowStock,
        publishedProducts: products.length,
      },
      dailySales: [...dailyMap.values()],
      statusBreakdown: [...statusMap].map(([status, count]) => ({ status, count })).sort((left, right) => right.count - left.count),
      paymentMix: [...paymentMap].map(([method, count]) => ({ method, count })).sort((left, right) => right.count - left.count),
      topProducts: [...productMap.values()].sort((left, right) => right.revenue - left.revenue).slice(0, 8),
      couponPerformance: [...couponMap.values()].sort((left, right) => right.orders - left.orders).slice(0, 8),
      recentOrders: currentOrders.slice(0, 8).map((order) => ({ _id: order._id, customerName: order.customerName, city: order.city, createdAt: order.createdAt, status: order.status, totalAmount: order.totalAmount })),
    });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/stats", protect, admin, async (req, res) => {

  try {

    const [totalOrders, totalProducts, totalUsers, pendingOrders, revenueResult] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments(),
        Order.countDocuments({ status: "Pending" }),
        Order.aggregate([
          { $match: { status: "Delivered" } },
          { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      totalRevenue,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});

export default router;
