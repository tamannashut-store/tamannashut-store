import express from "express";
import rateLimit from "express-rate-limit";
import { sendEmail } from "../utils/sendEmail.js";
import Contact from "../models/Contact.js";
import { admin, optionalProtect, protect } from "../middleware/authMiddleware.js";
import { contactAdminEmailTemplate, contactCustomerEmailTemplate, supportFollowUpEmailTemplate, supportReplyEmailTemplate } from "../utils/emailTemplates.js";
import { accountTypeFor } from "../utils/accountRoles.js";

const router = express.Router();
const contactTopics = new Set(["general", "order", "delivery", "return", "payment"]);
const topicLabels = { general: "General question", order: "Order support", delivery: "Delivery and tracking", return: "Return or refund", payment: "Payment support" };
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many messages. Please try again later." },
});
const replyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many support replies. Please try again later." },
});
const validId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
const referenceFor = (contact) => String(contact?._id || "").slice(-8).toUpperCase();
const customerOnly = (req, res, next) => accountTypeFor(req.user) === "customer" ? next() : res.status(403).json({ message: "Customer account required" });

router.get("/mine", protect, customerOnly, async (req, res) => {
    try {
        const contacts = await Contact.find({ customerId: req.user._id }).sort({ lastActivityAt: -1, createdAt: -1 }).limit(100).lean();
        return res.json(contacts);
    } catch {
        return res.status(500).json({ message: "Support requests could not be loaded" });
    }
});

router.get("/mine/:id", protect, customerOnly, async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid support reference" });
        const contact = await Contact.findOneAndUpdate({ _id: req.params.id, customerId: req.user._id }, { $set: { customerLastReadAt: new Date() } }, { new: true });
        if (!contact) return res.status(404).json({ message: "Support request not found" });
        return res.json(contact);
    } catch {
        return res.status(500).json({ message: "Support request could not be loaded" });
    }
});

router.post("/mine/:id/replies", protect, customerOnly, replyLimiter, async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid support reference" });
        const body = String(req.body.message || "").trim();
        if (body.length < 2 || body.length > 2000) return res.status(400).json({ message: "Reply must be between 2 and 2000 characters" });
        const contact = await Contact.findOne({ _id: req.params.id, customerId: req.user._id });
        if (!contact) return res.status(404).json({ message: "Support request not found" });
        if (contact.replies.length >= 100) return res.status(409).json({ message: "This conversation has reached its reply limit. Start a new support request" });
        contact.replies.push({ sender: "customer", body });
        contact.status = "open";
        contact.readAt = null;
        contact.customerLastReadAt = new Date();
        contact.lastActivityAt = new Date();
        await contact.save();
        await Promise.allSettled([sendEmail(process.env.ADMIN_EMAIL || "support@tamannashut.com", `Customer follow-up ${referenceFor(contact)}`, supportFollowUpEmailTemplate({ name: contact.name, email: contact.email, reference: referenceFor(contact), message: body }))]);
        return res.json(contact);
    } catch {
        return res.status(500).json({ message: "Your reply could not be saved" });
    }
});

router.get("/", protect, admin, async (req, res) => {
    try {
        const contacts = await Contact.find()
            .sort({ lastActivityAt: -1, createdAt: -1 });

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
router.patch("/:id/read", protect, admin, async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid support reference" });
        const contact = await Contact.findByIdAndUpdate(req.params.id, { $set: { readAt: new Date() } }, { new: true });
        if (!contact) return res.status(404).json({ success: false, message: "Support request not found" });
        return res.json(contact);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Support request could not be updated" });
    }
});
router.patch("/:id/status", protect, admin, async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid support reference" });
        const status = String(req.body.status || "");
        if (!["open", "in_progress", "resolved"].includes(status)) return res.status(400).json({ success: false, message: "Choose a valid support status" });
        const contact = await Contact.findByIdAndUpdate(req.params.id, { $set: { status, readAt: new Date(), lastActivityAt: new Date() } }, { new: true });
        if (!contact) return res.status(404).json({ success: false, message: "Support request not found" });
        return res.json(contact);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Support status could not be updated" });
    }
});
router.post("/:id/replies", protect, admin, replyLimiter, async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid support reference" });
        const body = String(req.body.message || "").trim();
        if (body.length < 2 || body.length > 2000) return res.status(400).json({ message: "Reply must be between 2 and 2000 characters" });
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Support request not found" });
        if (contact.replies.length >= 100) return res.status(409).json({ message: "This conversation has reached its reply limit" });
        contact.replies.push({ sender: "admin", body });
        if (contact.status === "open") contact.status = "in_progress";
        contact.readAt = new Date();
        contact.customerLastReadAt = null;
        contact.lastActivityAt = new Date();
        await contact.save();
        await Promise.allSettled([sendEmail(contact.email, `Update on support request ${referenceFor(contact)}`, supportReplyEmailTemplate({ name: contact.name, reference: referenceFor(contact), reply: body }))]);
        return res.json(contact);
    } catch {
        return res.status(500).json({ message: "Support reply could not be saved" });
    }
});

router.post("/", optionalProtect, contactLimiter, async (req, res) => {
    try {
        const accountCustomer = accountTypeFor(req.user) === "customer" ? req.user : null;
        const name = String(accountCustomer?.name || req.body.name || "").trim();
        const email = String(accountCustomer?.email || req.body.email || "").trim().toLowerCase();
        const topic = contactTopics.has(String(req.body.topic || "")) ? String(req.body.topic) : "general";
        const orderReference = String(req.body.orderReference || "").trim().slice(0, 40);
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
            customerId: accountCustomer?._id || null,
            name,
            email,
            topic,
            orderReference,
            message,
            customerLastReadAt: accountCustomer ? new Date() : null,
            lastActivityAt: new Date(),
        });
        const reference = String(contact._id).slice(-8).toUpperCase();

        // Admin Email
        const emailNotifications = [sendEmail(
            process.env.ADMIN_EMAIL || "support@tamannashut.com",
            `Support request ${reference} · ${topicLabels[topic]}`,
            contactAdminEmailTemplate({ name, email, topic: topicLabels[topic], orderReference, message, reference })
        )];

        // Customer Email
        emailNotifications.push(sendEmail(
            email,
            "Thank you for contacting Tamanna's Hut",
            contactCustomerEmailTemplate(name, reference)
        ));
        await Promise.allSettled(emailNotifications);

        res.json({
            success: true,
            message: "Message sent successfully",
            reference,
            accountLinked: Boolean(accountCustomer),
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
});

export default router;
