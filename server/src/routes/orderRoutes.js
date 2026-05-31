import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderEmailTemplate } from "../utils/emailTemplates.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";
import { sendWhatsApp } from "../utils/sendWhatsApp.js";

const router = express.Router();


// CREATE ORDER

router.post("/", async (req, res) => {

  try {

    const order = new Order(req.body);

    await order.save();
    await sendEmail(
      req.body.email,
      "Order Confirmed - Tamanna's Hut",
      `
        ${orderEmailTemplate(order)}
        <hr />
        ${invoiceTemplate(order)}
      `
    );
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
      <p><strong>Status:</strong> ${order.status}</p>
    
      <h3>Products</h3>
    
      <ul>
        ${order.products
          .map(
            (p) => `
              <li>
                ${p.name}
                | Size: ${p.selectedSize}
                | Qty: ${p.qty}
                | ₹${p.price}
              </li>
            `
          )
          .join("")}
      </ul>
      `
    );
    const phone = req.body.phone.startsWith("+")
      ? req.body.phone
      : `+91${req.body.phone}`;

    await sendWhatsApp(
      phone,
      `🛍 Order Confirmed!\n\nOrder ID: ${order._id}\nAmount: ₹${order.totalAmount}\nStatus: ${order.status}`
    );
    // REDUCE STOCK

    for (const item of req.body.products) {

      const product =
        await Product.findById(item._id);

      if (product) {

        const sizeData = product.sizeStock?.find(
          s => s.size === item.selectedSize
        );

        if (!sizeData) {

          console.log(
            "SIZE STOCK NOT FOUND:",
            product.name,
            item.selectedSize
          );

          return res.status(400).json({
            success: false,
            message: `Stock not configured for ${product.name} (${item.selectedSize})`
          });

        }

        if (sizeData) {

          if (sizeData.stock < item.qty) {

            return res.status(400).json({
              success: false,
              message: `${product.name} (${item.selectedSize}) is out of stock`
            });

          }

          sizeData.stock -= item.qty;

          await product.save();
        }
      }
    }

    res.json({
      success: true,
      message: "Order saved",
      order,
    });

  } catch (error) {

    console.error("ORDER ERROR:");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


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
    order.trackingNumber =
      req.body.trackingNumber ||
      order.trackingNumber;

    const updatedOrder =
      await order.save();

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