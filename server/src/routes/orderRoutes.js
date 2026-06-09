import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderEmailTemplate } from "../utils/emailTemplates.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";
import { sendWhatsApp } from "../utils/sendWhatsApp.js";
import { generateInvoice } from "../utils/generateInvoice.js";

const router = express.Router();


// CREATE ORDER

router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    // reduce stock first
    for (const item of req.body.products) {
      const product = await Product.findById(item._id);
      if (!product) continue;

      const sizeData = product.sizeStock?.find(
        (s) => s.size === item.selectedSize
      );

      if (!sizeData) {
        return res.status(400).json({
          success: false,
          message: `Stock not configured for ${product.name} (${item.selectedSize})`,
        });
      }

      if (sizeData.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} (${item.selectedSize}) is out of stock`,
        });
      }

      sizeData.stock -= item.qty;
      await product.save();
    }

    // customer email
    try {
      await sendEmail(
        order.email,
        "Order Confirmed - Tamanna's Hut",
        invoiceTemplate(order)
      );
    } catch (err) {
      console.log("CUSTOMER EMAIL ERROR:", err);
    }

    // admin email
    try {
      await sendEmail(
        process.env.ADMIN_EMAIL,
        `🛍 New Order Received - ${order._id}`,
        `
          <h2>New Order Received</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        `
      );
    } catch (err) {
      console.log("ADMIN EMAIL ERROR:", err);
    }

    // whatsapp
    try {
      const phone = req.body.phone.startsWith("+")
        ? req.body.phone
        : `+91${req.body.phone}`;

      await sendWhatsApp(
        phone,
        `🛍 Order Confirmed!\n\nOrder ID: ${order._id}\nAmount: ₹${order.totalAmount}\nStatus: ${order.status}`
      );
    } catch (err) {
      console.log("WHATSAPP ERROR:", err);
    }

    return res.json({
      success: true,
      message: "Order saved",
      order,
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get(
  "/invoice/:id",
  async (req, res) => {

    try {

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      generateInvoice(order, res);

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  }
);

// GET ALL ORDERS

router.get("/", async (req, res) => {

  try {

    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/cancel/:id", async (req, res) => {

  try {

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {

      return res.status(404).json({
        message: "Order not found",
      });

    }

    if (order.status !== "Pending") {

      return res.status(400).json({
        message:
          "Order cannot be cancelled",
      });

    }

    for (const item of order.products) {

      const product =
        await Product.findById(item._id);

      if (product) {

        const sizeData =
          product.sizeStock.find(
            s =>
              s.size ===
              item.selectedSize
          );

        if (sizeData) {

          sizeData.stock += item.qty;

        }

        await product.save();

      }

    }

    order.status = "Cancelled";

    await order.save();

    res.json({
      success: true,
      message:
        "Order Cancelled",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});
// UPDATE ORDER STATUS

router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Restore stock when cancelled
    if (
      req.body.status === "Cancelled" &&
      order.status !== "Cancelled"
    ) {
      for (const item of order.products) {

        const product =
          await Product.findById(item._id);

        if (product) {

          const sizeIndex =
            product.sizeStock.findIndex(
              s =>
                s.size ===
                item.selectedSize
            );

          if (sizeIndex !== -1) {
            product.sizeStock[
              sizeIndex
            ].stock += item.qty;

            await product.save();
          }
        }
      }
    }

    order.status = req.body.status;
    order.tracking = {
      trackingId:
        req.body.trackingNumber?.trackingId ||
        order.tracking?.trackingId,

      courier:
        req.body.trackingNumber?.courier ||
        order.tracking?.courier,
    };

    const updatedOrder = await order.save();
    await sendEmail(
      order.email,
      `Order Update - Tamanna's Hut`,
      `
      <h2>Order Status Updated</h2>
    
      <p>Hello ${order.customerName || order.name || "Customer"},</p>
    
      <p>Your order status has been updated.</p>
    
      <p>
        <strong>Order ID:</strong>
        ${order._id}
      </p>
    
      <p>
        <strong>New Status:</strong>
        ${order.status}
      </p>
    
      ${order.tracking?.trackingId
        ? `
            <p>
              <strong>Tracking ID:</strong>
              ${order.tracking.trackingId}
            </p>
      
            <p>
              <strong>Courier:</strong>
              ${order.tracking.courier}
            </p>
          `
        : ""}
    
      <br>
    
      <p>
        Thank you for shopping with Tamanna's Hut 💖
      </p>
      `
    );

    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// MY ORDERS

router.get("/my-orders/:userId", async (req, res) => {

  try {

    const orders = await Order.find({
      userId: req.params.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
});


export default router;