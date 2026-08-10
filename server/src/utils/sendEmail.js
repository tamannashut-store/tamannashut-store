import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return { sent: true, id: result?.data?.id || "" };
  } catch (error) {
    console.error("EMAIL ERROR:", String(error?.message || "Email delivery failed").slice(0, 200));
    return { sent: false };
  }
};
