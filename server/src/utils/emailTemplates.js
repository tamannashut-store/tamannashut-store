export const orderEmailTemplate = (order) => {
    
    return`
<div style="font-family:Arial;padding:20px;background:#f6f6f6">
  <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px">

    <h2 style="color:#2b2b2b">🛍 Order Confirmed!</h2>

    <p>Hi <b>${order.name || "Customer"}</b>,</p>

    <p>Thank you for shopping with <b>Tamanna's Hut</b>.</p>

    <hr/>

    <h3>Order Details</h3>

    <p><b>Order ID:</b> ${order._id}</p>
    <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
    <p><b>Status:</b> ${order.status}</p>

    <h3>Items</h3>

    ${order.products.map(p => `
      <div style="border-bottom:1px solid #eee;padding:10px 0">
        <p><b>${p.name}</b></p>
        <p>Size: ${p.selectedSize} | Qty: ${p.qty}</p>
      </div>
    `).join("")}

    <p style="margin-top:20px">
      We will notify you when your order is shipped 🚚
    </p>

    <p>— Tamanna's Hut Team</p>
  </div>
</div>
`;};