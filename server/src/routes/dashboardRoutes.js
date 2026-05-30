import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/stats", async (req, res) => {

  try {

    const totalOrders = await Order.countDocuments();

    const totalProducts = await Product.countDocuments();

    const totalUsers = await User.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: "Pending",
    });

    const deliveredOrders = await Order.find({
      status: "Delivered",
    });

    const totalRevenue = deliveredOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );

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