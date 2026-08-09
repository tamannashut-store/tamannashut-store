import PDFDocument from "pdfkit";

export const generatePackingSlip = (order, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 44 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=packing-slip-${order._id}.pdf`);
  doc.pipe(res);

  doc.fillColor("#183d2b").fontSize(23).text("Tamanna's Hut");
  doc.fillColor("#64748b").fontSize(10).text("PACKING SLIP", 400, 48, { align: "right" });
  doc.moveTo(44, 86).lineTo(551, 86).strokeColor("#dbe3dc").stroke();
  doc.fillColor("#111827").fontSize(11).text(`Order: #${String(order._id).slice(-8).toUpperCase()}`, 44, 105);
  doc.text(`Placed: ${new Date(order.createdAt).toLocaleString("en-IN")}`, 44, 123);
  doc.fontSize(13).text("Ship to", 44, 158);
  doc.fontSize(10).fillColor("#374151")
    .text(order.customerName || "Customer", 44, 180)
    .text(order.phone || "", 44, 196)
    .text(order.address || "", 44, 212, { width: 310 })
    .text(`${order.city || ""} - ${order.pincode || ""}`, 44, 242);

  let y = 286;
  doc.rect(44, y, 507, 26).fill("#eef3ee");
  doc.fillColor("#183d2b").fontSize(10).text("Item", 52, y + 8).text("SKU / Size", 350, y + 8).text("Qty", 505, y + 8);
  y += 26;
  order.products.forEach((item) => {
    doc.rect(44, y, 507, 34).strokeColor("#e5e7eb").stroke();
    doc.fillColor("#1f2937").fontSize(9).text(item.name || "Product", 52, y + 10, { width: 280 });
    doc.text(`${item.sku || "—"} / ${item.selectedSize || "—"}`, 350, y + 10, { width: 135 });
    doc.fontSize(11).text(String(item.qty || 1), 510, y + 9);
    y += 34;
  });
  doc.fillColor("#64748b").fontSize(9).text("Packed by: ____________________", 44, y + 28).text("Checked by: ____________________", 330, y + 28);
  doc.text("This document contains no product prices and is intended for fulfilment use.", 44, 760, { align: "center", width: 507 });
  doc.end();
};
