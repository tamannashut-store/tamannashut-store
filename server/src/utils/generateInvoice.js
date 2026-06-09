import PDFDocument from "pdfkit";

export const generateInvoice = (order, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${String(order._id)}.pdf`
  );

  doc.pipe(res);

  const invoiceNo = `TH-${new Date(order.createdAt)
    .getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;

  const subtotal = order.products.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const gstRate = 18;
  const taxableValue = (subtotal / 1.18).toFixed(2);
  const gstAmount = (subtotal - taxableValue).toFixed(2);
  const cgst = (gstAmount / 2).toFixed(2);
  const sgst = (gstAmount / 2).toFixed(2);

  // Header
  doc
    .fillColor("#ec4899")
    .fontSize(22)
    .text("Tamanna's Hut", 40, 40);

  doc
    .fillColor("#444444")
    .fontSize(10)
    .text("Premium Kids Fashion", 40, 68);

  doc
    .fillColor("#111111")
    .fontSize(16)
    .text("TAX INVOICE", 400, 40, { align: "right" });

  doc
    .fontSize(10)
    .text(`Invoice No: ${invoiceNo}`, 400, 65, { align: "right" })
    .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 80, {
      align: "right",
    });

  doc.moveDown(2);

  // Divider
  doc.moveTo(40, 110).lineTo(555, 110).strokeColor("#e5e7eb").stroke();

  // Billing + Supplier
  doc.moveDown(1.5);

  doc
    .fillColor("#111111")
    .fontSize(12)
    .text("Bill To", 40, 130);

  doc
    .fontSize(10)
    .fillColor("#333333")
    .text(`${order.customerName || "Customer"}`, 40, 150)
    .text(`${order.email || ""}`, 40, 165)
    .text(`${order.phone || ""}`, 40, 180)
    .text(`${order.address || ""}`, 40, 195)
    .text(`${order.city || ""} - ${order.pincode || ""}`, 40, 210);

  doc
    .fillColor("#111111")
    .fontSize(12)
    .text("Supplier", 360, 130);

  doc
    .fontSize(10)
    .fillColor("#333333")
    .text("Tamanna's Hut", 360, 150)
    .text("GSTIN: 19BKDPB6636D1ZE", 360, 165)
    .text("West Bengal, India", 360, 180)
    .text("support@tamannashut.com", 360, 195);

  // Table header
  const tableTop = 255;
  const startX = 40;
  const colWidths = [200, 80, 50, 90, 90];

  doc
    .rect(startX, tableTop, 515, 24)
    .fill("#f3f4f6");

  doc
    .fillColor("#111111")
    .fontSize(10)
    .text("Product", startX + 6, tableTop + 8, { width: colWidths[0] })
    .text("Size", startX + colWidths[0] + 6, tableTop + 8, { width: colWidths[1], align: "center" })
    .text("Qty", startX + colWidths[0] + colWidths[1] + 6, tableTop + 8, {
      width: colWidths[2],
      align: "center",
    })
    .text("Price", startX + colWidths[0] + colWidths[1] + colWidths[2] + 6, tableTop + 8, {
      width: colWidths[3],
      align: "right",
    })
    .text("Amount", startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 6, tableTop + 8, {
      width: colWidths[4],
      align: "right",
    });

  let y = tableTop + 24;

  order.products.forEach((item) => {
    const rowHeight = 26;

    doc
      .rect(startX, y, 515, rowHeight)
      .strokeColor("#e5e7eb")
      .stroke();

    doc
      .fillColor("#333333")
      .fontSize(9)
      .text(item.name || "-", startX + 6, y + 8, { width: colWidths[0] })
      .text(item.selectedSize || "-", startX + colWidths[0] + 6, y + 8, {
        width: colWidths[1],
        align: "center",
      })
      .text(String(item.qty || 0), startX + colWidths[0] + colWidths[1] + 6, y + 8, {
        width: colWidths[2],
        align: "center",
      })
      .text(`₹${item.price || 0}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 6, y + 8, {
        width: colWidths[3],
        align: "right",
      })
      .text(
        `₹${(item.price || 0) * (item.qty || 0)}`,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 6,
        y + 8,
        {
          width: colWidths[4],
          align: "right",
        }
      );

    y += rowHeight;
  });

  // Totals
  y += 20;

  doc
    .fillColor("#111111")
    .fontSize(10)
    .text("Taxable Value", 350, y)
    .text(`₹${taxableValue}`, 490, y, { align: "right" });

  y += 16;
  doc.text("CGST (9%)", 350, y).text(`₹${cgst}`, 490, y, { align: "right" });

  y += 16;
  doc.text("SGST (9%)", 350, y).text(`₹${sgst}`, 490, y, { align: "right" });

  y += 16;
  doc.moveTo(350, y).lineTo(555, y).strokeColor("#e5e7eb").stroke();

  y += 12;
  doc
    .fillColor("#ec4899")
    .fontSize(14)
    .text("Total", 350, y)
    .text(`₹${order.totalAmount}`, 490, y, { align: "right" });

  y += 30;

  // Payment details
  doc
    .fillColor("#111111")
    .fontSize(11)
    .text("Payment Details", 40, y);

  y += 16;
  doc
    .fillColor("#333333")
    .fontSize(10)
    .text(`Payment Method: ${order.paymentMethod || "Online"}`, 40, y);

  y += 14;
  doc.text(`Payment Status: ${order.paymentStatus || "Paid"}`, 40, y);

  y += 14;
  doc.text(`Order Status: ${order.status || "Processing"}`, 40, y);

  // Footer
  doc
    .fillColor("#666666")
    .fontSize(9)
    .text(
      "Thank you for shopping with Tamanna's Hut 💖",
      40,
      760,
      { align: "center", width: 515 }
    )
    .text(
      "This is a computer-generated GST invoice and does not require a signature.",
      40,
      775,
      { align: "center", width: 515 }
    );

  doc.end();
};