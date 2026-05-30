import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// send whatsapp message
export const sendWhatsApp = async (to, message) => {
  try {
    await client.messages.create({
      from: "whatsapp:+918247502207", // Twilio sandbox number
      to: `whatsapp:${to}`, // dynamic number
      body: message,
    });
  } catch (err) {
    console.log("WHATSAPP ERROR:", err.message);
  }
};