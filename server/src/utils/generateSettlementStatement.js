import PDFDocument from "pdfkit";

const green = "#123b29";
const ink = "#172033";
const muted = "#64748b";
const line = "#dfe6e1";
const cream = "#f7f5ef";
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortId = (value) => String(value?._id || value || "").slice(-8).toUpperCase();

export const generateSettlementStatement = (settlement, res) => {
  const seller = settlement.sellerId || {};
  const order = settlement.orderId || {};
  const statementNo = `TH-ST-${shortId(settlement)}`;
  const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Seller settlement ${statementNo}`, Author: "Tamanna's Hut" } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=settlement-${statementNo}.pdf`);
  doc.pipe(res);

  doc.rect(0, 0, 595.28, 92).fill(green);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("Tamanna's Hut", 40, 28);
  doc.fillColor("#c9d8ce").font("Helvetica").fontSize(8).text("SELLER CENTRE  |  SETTLEMENT STATEMENT", 40, 59, { characterSpacing: 1.1 });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text(statementNo, 330, 36, { width: 225, align: "right" });

  doc.fillColor(ink).font("Helvetica-Bold").fontSize(18).text("Settlement statement", 40, 122);
  doc.fillColor(muted).font("Helvetica").fontSize(9)
    .text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 151)
    .text(`Seller: ${seller.name || seller.email || "Seller"}`, 40, 169)
    .text(`Seller email: ${seller.email || "-"}`, 40, 187)
    .text(`Order: #${shortId(order)}`, 330, 151, { width: 225, align: "right" })
    .text(`Invoice: ${order.invoiceNumber || "Not assigned"}`, 330, 169, { width: 225, align: "right" })
    .text(`Order status: ${order.status || "-"}`, 330, 187, { width: 225, align: "right" });

  doc.roundedRect(40, 220, 515, 68, 10).fill(cream);
  doc.fillColor(muted).font("Helvetica-Bold").fontSize(8).text("SETTLEMENT STATUS", 55, 238);
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(16).text(String(settlement.status || "pending").replaceAll("_", " ").toUpperCase(), 55, 254);
  doc.fillColor(muted).font("Helvetica").fontSize(8).text("PAYABLE", 390, 238, { width: 145, align: "right" });
  doc.fillColor(green).font("Helvetica-Bold").fontSize(16).text(money(settlement.payableAmount), 390, 254, { width: 145, align: "right" });

  const rows = [
    ["Gross product value", settlement.grossAmount],
    ["Allocated customer discount", -Number(settlement.allocatedDiscount || 0)],
    ["Net sales", settlement.netSalesAmount],
    [`Marketplace fee (${Number(settlement.commissionPercent || 0)}%)`, -Number(settlement.commissionAmount || 0)],
    ["Refund allocation", -Number(settlement.refundAmount || 0)],
    ["Settlement adjustments", settlement.adjustmentAmount],
    ["Final payable", settlement.payableAmount],
  ];
  let y = 320;
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("CALCULATION", 40, y);
  y += 25;
  for (const [label, value] of rows) {
    const final = label === "Final payable";
    if (final) { doc.moveTo(40, y - 8).lineTo(555, y - 8).strokeColor(line).stroke(); }
    doc.fillColor(final ? green : muted).font(final ? "Helvetica-Bold" : "Helvetica").fontSize(final ? 11 : 9).text(label, 40, y);
    doc.text(money(value), 390, y, { width: 165, align: "right" });
    y += final ? 32 : 24;
  }

  if ((settlement.adjustments || []).length) {
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("ADJUSTMENT LEDGER", 40, y + 8);
    y += 34;
    for (const adjustment of settlement.adjustments) {
      if (y > 700) { doc.addPage(); y = 55; }
      doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text(String(adjustment.category || "other").replaceAll("_", " "), 40, y, { width: 150 });
      doc.fillColor(muted).font("Helvetica").fontSize(8).text(adjustment.note || "-", 175, y, { width: 270 });
      doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text(money(adjustment.amount), 455, y, { width: 100, align: "right" });
      y += 28;
    }
  }

  if (settlement.paymentReference || settlement.payoutFailureReason) {
    if (y > 680) { doc.addPage(); y = 55; }
    doc.roundedRect(40, y + 10, 515, 72, 9).fill("#eef5f0");
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text("PAYOUT RECONCILIATION", 55, y + 26);
    doc.fillColor(muted).font("Helvetica").fontSize(9).text(
      settlement.paymentReference ? `${settlement.paymentMethod || "Transfer"}: ${settlement.paymentReference}` : `Exception: ${settlement.payoutFailureReason}`,
      55, y + 46, { width: 470 }
    );
  }

  doc.fillColor(muted).font("Helvetica").fontSize(7.5).text("This statement records marketplace settlement calculations and the payout status maintained by Tamanna's Hut Seller Centre.", 40, 780, { width: 515, align: "center" });
  doc.end();
};
