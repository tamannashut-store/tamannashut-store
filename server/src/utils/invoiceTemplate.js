export const invoiceTemplate = (order) => {
    return `
    <div style="font-family:Arial;background:#f6f6f6;padding:20px">
      <div style="max-width:700px;margin:auto;background:#fff;padding:20px;border-radius:10px">
  
        <h2 style="text-align:center">TAMANNAS HUT INVOICE</h2>
  
        <hr/>
  
        <p><b>Invoice ID:</b> ${order._id}</p>
        <p><b>Date:</b> ${new Date(order.createdAt).toDateString()}</p>
        <p><b>Customer:</b> ${order.customerName || "Customer"}</p>
  
        <hr/>
  
        <h3>Items</h3>
  
        <table width="100%" border="1" cellspacing="0" cellpadding="8">
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
  
          ${order.products
            .map(
              (p) => `
            <tr>
              <td>${p.name}</td>
              <td>${p.selectedSize}</td>
              <td>${p.qty}</td>
              <td>₹${p.price || 0}</td>
            </tr>
          `
            )
            .join("")}
        </table>
  
        <h3 style="text-align:right;margin-top:20px">
          Total: ₹${order.totalAmount}
        </h3>
  
        <p style="text-align:center;margin-top:30px">
          Thank you for shopping with Tamanna's Hut 💖
        </p>
  
      </div>
    </div>
    `;
  };