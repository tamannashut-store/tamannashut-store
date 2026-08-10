import dotenv from "dotenv";
dotenv.config();
import twilio from "twilio";

export const sendWhatsApp = async (to, message) => {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH) {
    return { skipped: true, reason: "WhatsApp is not configured" };
  }
  try {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    const formattedNumber = to.startsWith("+")
      ? to
      : `+91${to}`;

    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${formattedNumber}`,
      body: message,
    });

    return { sent: true };
  } catch (err) {
    console.error("WHATSAPP ERROR:", String(err?.message || "Message delivery failed").slice(0, 200));
    return { sent: false };
  }
};
