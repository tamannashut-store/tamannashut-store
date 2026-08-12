import { escapeHtml } from "./html.js";
import { paymentMethodLabel, paymentStatusLabel } from "./paymentPresentation.js";

export const orderEmailTemplate = (order) => {
  const cod = order.paymentMethod === "COD";
  const paymentMessage = cod
    ? "No payment has been collected. Please pay the order total when your parcel is delivered."
    : "Your online payment has been verified successfully.";
  return `
<div style="font-family:Arial,sans-serif;padding:20px;background:#f6f6f6;color:#1f2937">
  <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:12px">
    <h2 style="color:#183d2b;margin-top:0">Order received</h2>
    <p>Hi <b>${escapeHtml(order.customerName || "Customer")}</b>,</p>
    <p>Thank you for shopping with <b>Tamanna's Hut</b>. We have received your order and will notify you when it ships.</p>
    <div style="margin:20px 0;padding:16px;background:#f4f7f5;border-radius:10px">
      <p style="margin:0 0 8px"><b>Payment method:</b> ${paymentMethodLabel(order)}</p>
      <p style="margin:0 0 8px"><b>Payment status:</b> ${paymentStatusLabel(order)}</p>
      <p style="margin:0">${paymentMessage}</p>
    </div>
    <h3>Order details</h3>
    <p><b>Order ID:</b> ${escapeHtml(order._id)}</p>
    <p><b>Total:</b> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
    <p><b>Order status:</b> ${escapeHtml(order.status || "Pending")}</p>
    <h3>Items</h3>
    ${(order.products || []).map((item) => `
      <div style="border-bottom:1px solid #e5e7eb;padding:10px 0">
        <p style="margin:0 0 6px"><b>${escapeHtml(item.name)}</b></p>
        <p style="margin:0;color:#64748b">${item.selectedColor ? `Colour: ${escapeHtml(item.selectedColor)} | ` : ""}Size: ${escapeHtml(item.selectedSize)} | Qty: ${Number(item.qty || 0)}</p>
      </div>
    `).join("")}
    <p style="margin-top:24px">— Tamanna's Hut Team</p>
  </div>
</div>`;
};
