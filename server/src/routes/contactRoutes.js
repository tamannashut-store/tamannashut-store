import express from "express";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {

    const { name, email, message } = req.body;

    await sendEmail(
      "support@tamannashut.com",
      "New Contact Form Message",
      `
Name: ${name}

Email: ${email}

Message:
${message}
`
    );

    res.json({
      success: true,
      message: "Message sent",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send",
    });

  }
});

export default router;