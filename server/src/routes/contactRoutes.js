import express from "express";
import rateLimit from "express-rate-limit";
import { sendEmail } from "../utils/sendEmail.js";
import Contact from "../models/Contact.js";
import { admin, protect } from "../middleware/authMiddleware.js";
import { contactAdminEmailTemplate, contactCustomerEmailTemplate } from "../utils/emailTemplates.js";

const router = express.Router();
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many messages. Please try again later." },
});

router.get("/", protect, admin, async (req, res) => {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 });

        res.json(contacts);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch contacts",
        });
    }
});
router.patch("/read", protect, admin, async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean).slice(0, 200) : [];
        if (!ids.length) return res.json({ success: true, modifiedCount: 0 });
        const result = await Contact.updateMany({ _id: { $in: ids }, readAt: null }, { $set: { readAt: new Date() } });
        return res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
router.post("/", contactLimiter, async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const message = String(req.body.message || "").trim();
        if (name.length < 2 || name.length > 80 || email.length > 254 || message.length < 10 || message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid name, email and message between 10 and 2000 characters",
            });
        }
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address",
            });
        }
        const contact = await Contact.create({
            name,
            email,
            message,
        });

        // Admin Email
        await sendEmail(
            process.env.ADMIN_EMAIL || "support@tamannashut.com",
            "New Contact Form Message",
            contactAdminEmailTemplate({ name, email, message })
        );

        // Customer Email
        await sendEmail(
            email,
            "Thank you for contacting Tamanna's Hut",
            contactCustomerEmailTemplate(name)
        );

        res.json({
            success: true,
            message: "Message sent successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
});

export default router;
