import Order from "../models/Order.js";
import Product from "../models/Product.js";

// CREATE ORDER

export const createOrder = async (
    req,
    res
) => {

    try {

        const order = new Order(req.body);

        await order.save();

        // REDUCE STOCK

        for (const item of order.products) {

            const product =
                await Product.findById(
                    item._id
                );

            if (product) {

                product.stock -= item.qty;

                if (product.stock < 0) {

                    product.stock = 0;
                }

                await product.save();
            }
        }

        res.status(201).json(order);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

// GET ALL ORDERS

export const getOrders = async (
    req,
    res
) => {

    try {

        const orders =
            await Order.find().sort({
                createdAt: -1,
            });

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

// UPDATE ORDER STATUS

export const updateOrderStatus =
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

            order.status =
                req.body.status;

            await order.save();

            res.json(order);

        } catch (error) {

            res.status(500).json({
                message: error.message,
            });
        }
    };