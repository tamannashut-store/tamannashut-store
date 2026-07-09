import Order from "../models/Order.js";
import Product from "../models/Product.js";

// CREATE ORDER

export const createOrder = async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();

        const bulkOps = order.products.map((item) => ({
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { stock: -item.qty } },
            },
        }));
        if (bulkOps.length) {
            await Product.bulkWrite(bulkOps);
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ALL ORDERS

export const getOrders = async (
    req,
    res
) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(),
        ]);

        res.json({ orders, totalPages: Math.ceil(total / limit), currentPage: page });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

// UPDATE ORDER STATUS

export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.status = req.body.status;
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};