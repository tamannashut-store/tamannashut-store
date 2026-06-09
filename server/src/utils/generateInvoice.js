import PDFDocument from "pdfkit";

export const generateInvoice = (order, res) => {
  const doc = new PDFDocument();

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(22).text(
    "Tamanna's Hut Invoice",
    { align: "center" }
  );

  doc.moveDown();

  doc.text(`Order ID: ${order._id}`);
  doc.text(`Customer: ${order.customerName}`);
  doc.text(`Email: ${order.email}`);
  doc.text(`Phone: ${order.phone}`);

  doc.moveDown();

  doc.text("Products:");

  order.products.forEach((item) => {
    doc.text(
      `${item.name} (${item.selectedSize}) x ${item.qty} = ₹${item.price * item.qty}`
    );
  });

  doc.moveDown();

  doc.fontSize(18).text(
    `Total: ₹${order.totalAmount}`
  );

  doc.end();
};