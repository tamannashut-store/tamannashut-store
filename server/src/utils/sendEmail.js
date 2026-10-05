import { Resend } from "resend";

export const sendEmail = async (to, subject, html) => {
  if (!to) return { sent: false, skipped: true };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (result?.error || !result?.data?.id) return { sent: false };
    return { sent: true, id: result.data.id };
  } catch (error) {
    console.error("EMAIL ERROR:", String(error?.message || "Email delivery failed").slice(0, 200));
    return { sent: false };
  }
};
