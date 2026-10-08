import { sendEmail } from "../utils/sendEmail.js";
import { invoiceTemplate } from "../utils/invoiceTemplate.js";

export async function sendInvoiceEmail(order, { send = sendEmail } = {}) {
  if (!order.email) throw Object.assign(new Error("This order has no email address. Download the invoice instead."), { status: 400 });
  const result = await send(order.email, `Invoice ${String(order._id).slice(-8).toUpperCase()} - Tamanna's Hut`, invoiceTemplate(order));
  if (!result?.sent) throw Object.assign(new Error("The email provider did not accept the invoice. Please retry or download it instead."), { status: 502 });
  return { success: true, message: "Invoice accepted for email delivery" };
}
