import express from "express";
import { sendEmail } from "../utils/sendEmail.js";
import Contact from "../models/Contact.js";

const router = express.Router();

router.get("/contacts", async (req, res) => {
    try {
      const contacts = await Contact.find()
        .sort({ createdAt: -1 });
  
      res.json({
        success: true,
        contacts,
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to get contacts",
      });
    }
  });
router.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({
              success: false,
              message: "All fields are required",
            });
          }
        const contact = await Contact.create({
            name,
            email,
            message,
          });

        console.log(contact);

        // Admin Email
        await sendEmail(
            "support@tamannashut.com",
            "New Contact Form Message",
            `
        <h2>New Contact Form Message</h2>
  
        <p><strong>Name:</strong> ${name}</p>
  
        <p><strong>Email:</strong> ${email}</p>
  
        <p><strong>Message:</strong> ${message}</p>
        `
        );

        // Customer Email
        await sendEmail(
            email,
            "Thank you for contacting Tamanna's Hut",
            `
        <div style="font-family:Arial;padding:20px">
  
        <h2>Thank You For Contacting Tamanna's Hut 💖</h2>
  
        <p>Dear ${name},</p>
  
        <p>
        We have received your message successfully.
        Our team will get back to you shortly.
        </p>
  
        <p>
        Thank you for choosing Tamanna's Hut.
        </p>
  
        <br>
  
        <strong>Team Tamanna's Hut</strong>
  
        </div>
        `
        );

        res.json({
            success: true,
            message: "Message sent successfully",
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
});

export default router;