import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();


// CREATE ORDER

router.post("/", async (req, res) => {

    try {

        const order = new Order(req.body);

        await order.save();

        // REDUCE STOCK

        for (const item of req.body.products) {

            const product =
                await Product.findById(item._id);

            if (product) {

                const sizeData =
  product.sizeStock.find(
    s =>
      s.size === item.selectedSize
  );

if (sizeData) {
  sizeData.stock -= item.qty;
}

await product.save();

                if (product.stock < 0) {

                    product.stock = 0;
                }

                await product.save();
            }
        }

        res.json({
            success: true,
            message: "Order saved",
            order,
        });

    } catch (error) {

        console.log(error);

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