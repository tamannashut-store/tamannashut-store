import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/stats", async (req, res) => {

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