import PDFDocument from "pdfkit";

const PAGE = { left: 44, right: 551, bottom: 760 };
const COLORS = {
  green: "#183d2b",
  greenSoft: "#eef5f0",
  ink: "#172033",
  muted: "#64748b",
  line: "#dbe3dc",
  white: "#ffffff",
};

const text = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const orderNumber = (order) => String(order?._id || "").slice(-8).toUpperCase() || "PENDING";

const addFooter = (doc) => {
  const range = doc.bufferedPageRange();
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
    .text("Fulfilment document - prices intentionally excluded", PAGE.left, PAGE.bottom, { width: 390 })
    .text(`Page ${range.start + range.count}`, 470, PAGE.bottom, { align: "right", width: 80 });
};

const addHeader = (doc, order) => {
  doc.roundedRect(PAGE.left, 38, PAGE.right - PAGE.left, 58, 8).fill(COLORS.green);
  doc.font("Helvetica-Bold").fontSize(21).fillColor(COLORS.white).text("Tamanna's Hut", 60, 52);
  doc.font("Helvetica").fontSize(9).text("HUT OF PURITY", 61, 77, { characterSpacing: 1.6 });
  doc.font("Helvetica-Bold").fontSize(12).text("PACKING SLIP", 405, 52, { align: "right", width: 128 });
  doc.font("Helvetica").fontSize(8).text(`#${orderNumber(order)}`, 405, 73, { align: "right", width: 128 });
};

const addPage = (doc, order) => {
  doc.addPage();
  addHeader(doc, order);
  return 116;
};

const drawLabelValue = (doc, label, value, x, y, width) => {
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.muted).text(label.toUpperCase(), x, y, { width });
  doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.ink).text(text(value), x, y + 13, { width });
};

const drawItemHeader = (doc, y) => {
  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 27, 4).fill(COLORS.greenSoft);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.green)
    .text("ITEM", 54, y + 9, { width: 176 })
    .text("VARIANT", 236, y + 9, { width: 90 })
    .text("SKU", 332, y + 9, { width: 142 })
    .text("QTY", 478, y + 9, { width: 28, align: "center" })
    .text("CHECK", 510, y + 9, { width: 34, align: "center" });
  return y + 33;
};

export const buildPackingSlipDocument = (order) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.left,
    autoFirstPage: false,
    bufferPages: true,
    info: { Title: `Packing slip ${orderNumber(order)}`, Author: "Tamanna's Hut" },
  });
  let y = addPage(doc, order);

  const courier = order.shipping?.courierName || order.tracking?.courier;
  const awb = order.shipping?.awbCode || order.tracking?.trackingId;
  const totalUnits = (order.products || []).reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  const payment = order.paymentMethod === "COD" ? "Cash on delivery" : "Online - paid";
  const destination = [order.city, order.state, order.pincode].filter(Boolean).join(" - ");

  doc.roundedRect(PAGE.left, y, 309, 124, 8).strokeColor(COLORS.line).stroke();
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.green).text("SHIP TO", 58, y + 14);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink).text(text(order.customerName, "Customer"), 58, y + 36, { width: 280 });
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.ink)
    .text(text(order.phone), 58, y + 53, { width: 280 })
    .text(text(order.address), 58, y + 69, { width: 280, height: 28 })
    .text(text(destination), 58, y + 101, { width: 280 });

  doc.roundedRect(365, y, 186, 124, 8).strokeColor(COLORS.line).stroke();
  drawLabelValue(doc, "Order placed", order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-", 379, y + 14, 158);
  drawLabelValue(doc, "Payment", payment, 379, y + 48, 158);
  drawLabelValue(doc, "Order status", order.status, 379, y + 82, 72);
  drawLabelValue(doc, "Packages / units", `1 / ${totalUnits}`, 462, y + 82, 75);
  y += 140;

  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 61, 8).fill(COLORS.greenSoft);
  drawLabelValue(doc, "Courier partner", courier || "Not assigned", 58, y + 12, 185);
  drawLabelValue(doc, "AWB / tracking number", awb || "Not assigned", 254, y + 12, 185);
  drawLabelValue(doc, "Pickup", order.shipping?.pickupScheduled ? "Scheduled" : "Not scheduled", 450, y + 12, 87);
  y += 81;

  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.ink).text(`ITEMS TO PACK (${totalUnits})`, PAGE.left, y);
  y = drawItemHeader(doc, y + 20);

  for (const item of order.products || []) {
    const nameHeight = doc.heightOfString(text(item.name, "Product"), { width: 176 });
    const skuHeight = doc.heightOfString(text(item.sku), { width: 142 });
    const rowHeight = Math.max(42, Math.ceil(Math.max(nameHeight, skuHeight)) + 20);
    if (y + rowHeight > 716) {
      addFooter(doc);
      y = addPage(doc, order);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink).text("ITEMS TO PACK - CONTINUED", PAGE.left, y);
      y = drawItemHeader(doc, y + 18);
    }
    doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, rowHeight, 4).strokeColor(COLORS.line).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink).text(text(item.name, "Product"), 54, y + 11, { width: 176 });
    doc.font("Helvetica").fontSize(8.5).text(`${text(item.selectedColor)} / ${text(item.selectedSize)}`, 236, y + 11, { width: 90 });
    doc.font("Helvetica").fontSize(8).text(text(item.sku), 332, y + 11, { width: 142 });
    doc.font("Helvetica-Bold").fontSize(10).text(String(Math.max(1, Number(item.qty) || 1)), 478, y + 11, { width: 28, align: "center" });
    doc.rect(519, y + 10, 12, 12).strokeColor(COLORS.green).stroke();
    y += rowHeight + 5;
  }

  if (!(order.products || []).length) {
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("No order items found.", 54, y + 8);
    y += 34;
  }

  if (y + 104 > 716) {
    addFooter(doc);
    y = addPage(doc, order);
  }
  y += 18;
  doc.moveTo(PAGE.left, y).lineTo(PAGE.right, y).strokeColor(COLORS.line).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink).text("FINAL PACKING CHECK", PAGE.left, y + 16);
  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted)
    .text("[  ] Correct colour and size", PAGE.left, y + 36)
    .text("[  ] Quantity verified", 210, y + 36)
    .text("[  ] Product condition checked", 350, y + 36);
  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.ink)
    .text("Packed by: ____________________", PAGE.left, y + 62)
    .text("Checked by: ____________________", 300, y + 62);

  addFooter(doc);
  return doc;
};

export const generatePackingSlip = (order, res) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=packing-slip-${orderNumber(order)}.pdf`);
  const doc = buildPackingSlipDocument(order);
  doc.pipe(res);
  doc.end();
  return doc;
};
