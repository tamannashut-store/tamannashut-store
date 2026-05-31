import dotenv from "dotenv";
dotenv.config();
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
console.log("SID:", process.env.TWILIO_SID);
console.log("AUTH:", process.env.TWILIO_AUTH);
// send whatsapp message
export const sendWhatsApp = async (to, message) => {
  try {
    const result = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log("Message sent:", result.sid);
  } catch (err) {
    console.log("WHATSAPP ERROR:");
    console.log(err);
  }
};