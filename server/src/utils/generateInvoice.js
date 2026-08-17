import PDFDocument from "pdfkit";
import { paymentMethodLabel, paymentStatusLabel } from "./paymentPresentation.js";
import { calculateInvoiceTotals } from "./invoiceTemplate.js";

const green = "#123b29";
const mutedGreen = "#397153";
const ink = "#172033";
const muted = "#64748b";
const line = "#dfe6e1";
const cream = "#f7f5ef";
const currency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const safe = (value, fallback = "-") => String(value ?? "").trim() || fallback;

export const generateInvoice = (order, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true, info: { Title: `Tamanna's Hut invoice ${order._id}`, Author: "Tamanna's Hut" } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${String(order._id)}.pdf`);
  doc.pipe(res);

  const totals = calculateInvoiceTotals(order);
  const invoiceNo = order.invoiceNumber || `TH-${new Date(order.createdAt).getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;
  const orderShort = String(order._id).slice(-8).toUpperCase();

  const pageHeader = (continued = false) => {
    doc.rect(0, 0, 595.28, 92).fill(green);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("Tamanna's Hut", 40, 28);
    doc.fillColor("#c9d8ce").font("Helvetica").fontSize(8).text("HUT OF PURITY  |  PREMIUM KIDSWEAR", 40, 59, { characterSpacing: 1.2 });
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(14).text(continued ? "TAX INVOICE · CONTINUED" : "TAX INVOICE", 335, 31, { width: 220, align: "right" });
    doc.fillColor("#c9d8ce").font("Helvetica").fontSize(8).text(invoiceNo, 335, 56, { width: 220, align: "right" });
  };

  const tableHeader = (y) => {
    doc.roundedRect(40, y, 515, 28, 5).fill("#eef5f0");
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(8)
      .text("ITEM", 50, y + 10, { width: 245 })
      .text("QTY", 310, y + 10, { width: 38, align: "center" })
      .text("RATE", 365, y + 10, { width: 80, align: "right" })
      .text("NET AMOUNT", 465, y + 10, { width: 80, align: "right" });
    return y + 36;
  };

  pageHeader();
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("INVOICE DETAILS", 40, 118);
  doc.fillColor(muted).font("Helvetica").fontSize(9)
    .text(`Invoice number: ${invoiceNo}`, 40, 138)
    .text(`Invoice date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 40, 154)
    .text(`Order reference: #${orderShort}`, 40, 170);

  doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("SUPPLIER", 340, 118);
  doc.fillColor(muted).font("Helvetica").fontSize(9)
    .text("Tamanna Enterprise", 340, 138)
    .text("House No. N0072, Ground Floor", 340, 154)
    .text("Raghudebbati West, Sankrail", 340, 170)
    .text("Howrah, West Bengal 711310", 340, 186)
    .text("GSTIN: 19BKDPB6636D1ZE | State code: 19", 340, 202)
    .text("support@tamannashut.com", 340, 218);

  doc.roundedRect(40, 240, 515, 95, 10).fill(cream);
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("BILL TO", 55, 257);
  const customerLines = [safe(order.customerName, "Customer"), safe(order.address), `${safe(order.city)}${order.state ? `, ${safe(order.state)}` : ""} - ${safe(order.pincode)}`, safe(order.phone), safe(order.email)];
  doc.fillColor(muted).font("Helvetica").fontSize(9).text(customerLines.join("\n"), 55, 277, { width: 460, lineGap: 2 });

  let y = tableHeader(356);
  for (const item of totals.lines) {
    const details = [item.selectedColor && `Colour: ${item.selectedColor}`, item.selectedSize && `Size: ${item.selectedSize}`, (item.selectedSku || item.sku) && `SKU: ${item.selectedSku || item.sku}`, item.hsnCode && `HSN: ${item.hsnCode}`, `GST: ${item.rate}%`].filter(Boolean).join("  |  ");
    const nameHeight = doc.font("Helvetica-Bold").fontSize(9).heightOfString(safe(item.name, "Product"), { width: 245 });
    const detailsHeight = details ? doc.font("Helvetica").fontSize(8).heightOfString(details, { width: 245 }) + 3 : 0;
    const rowHeight = Math.max(42, nameHeight + detailsHeight + 18);
    if (y + rowHeight > 692) {
      doc.addPage();
      pageHeader(true);
      y = tableHeader(118);
    }
    doc.moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).strokeColor(line).lineWidth(0.7).stroke();
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text(safe(item.name, "Product"), 50, y + 8, { width: 245 });
    if (details) doc.fillColor(muted).font("Helvetica").fontSize(8).text(details, 50, y + 12 + nameHeight, { width: 245 });
    doc.fillColor(ink).font("Helvetica").fontSize(9)
      .text(String(Number(item.qty || 0)), 310, y + 12, { width: 38, align: "center" })
      .text(currency(item.price), 365, y + 12, { width: 80, align: "right" })
      .text(currency(item.inclusiveValue), 465, y + 12, { width: 80, align: "right" });
    y += rowHeight;
  }

  if (y + 210 > 710) { doc.addPage(); pageHeader(true); y = 120; }
  const totalsX = 330;
  const valueX = 455;
  y += 20;
  const totalRow = (label, value, options = {}) => {
    doc.fillColor(options.color || muted).font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(options.size || 9).text(label, totalsX, y, { width: 125 });
    doc.text(value, valueX, y, { width: 100, align: "right" });
    y += options.gap || 18;
  };
  totalRow("Item subtotal", currency(totals.itemSubtotal));
  if (totals.discount) totalRow("Discount", `- ${currency(totals.discount)}`, { color: mutedGreen });
  totalRow("Taxable value", currency(totals.taxable));
  if (totals.intraState) {
    totalRow("CGST", currency(totals.cgst));
    totalRow("SGST", currency(totals.sgst));
  } else {
    totalRow("IGST", currency(totals.igst));
  }
  doc.moveTo(totalsX, y).lineTo(555, y).strokeColor(line).stroke();
  y += 11;
  totalRow("TOTAL", currency(totals.total), { color: green, bold: true, size: 13, gap: 28 });

  doc.roundedRect(40, y, 515, 66, 9).fill("#eef5f0");
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text("PAYMENT DETAILS", 55, y + 14);
  doc.fillColor(muted).font("Helvetica").fontSize(9)
    .text(`Method: ${paymentMethodLabel(order)}`, 55, y + 34, { width: 220 })
    .text(`Status: ${paymentStatusLabel(order)} | Place of supply: ${totals.destinationState}`, 260, y + 34, { width: 275, align: "right" });

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.moveTo(40, 774).lineTo(555, 774).strokeColor(line).lineWidth(0.5).stroke();
    doc.fillColor(muted).font("Helvetica").fontSize(7.5)
      .text("This is a computer-generated GST invoice and does not require a signature.", 40, 783, { width: 420, lineBreak: false })
      .text(`Page ${index - range.start + 1} of ${range.count}`, 465, 783, { width: 90, align: "right", lineBreak: false });
  }
  doc.end();
};
