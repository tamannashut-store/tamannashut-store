export const invoiceTemplate = (order) => {

  const subtotal = order.products.reduce(
    (acc, item) => acc + (item.price * item.qty),
    0
  );

  const gstRate = 18;
  const taxableAmount = (
    subtotal / (1 + gstRate / 100)
  ).toFixed(2);

  const gstAmount = (
    subtotal - taxableAmount
  ).toFixed(2);

  const cgst = (gstAmount / 2).toFixed(2);
  const sgst = (gstAmount / 2).toFixed(2);

  return `
  <div style="
    font-family:Arial,sans-serif;
    background:#f4f4f4;
    padding:30px;
  ">

    <div style="
      max-width:850px;
      margin:auto;
      background:#fff;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 4px 15px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->

      <div style="
        background:#ec4899;
        color:#fff;
        padding:25px 30px;
      ">

        <table width="100%">
          <tr>

            <td>

              <img
                src="https://www.tamannashut.com/logo.png"
                width="90"
                alt="Tamanna's Hut"
              />

            </td>

            <td align="right">

              <h1 style="
                margin:0;
                font-size:30px;
              ">
                Tamanna's Hut
              </h1>

              <p style="
                margin:6px 0 0;
                opacity:0.95;
              ">
                Premium Kids Fashion
              </p>

            </td>

          </tr>
        </table>

      </div>

      <!-- BODY -->

      <div style="padding:30px;">

        <table width="100%">
          <tr>

            <td>

              <h2 style="
                margin:0;
                color:#111827;
              ">
                TAX INVOICE
              </h2>

              <p>
                Invoice No:
                <strong>
                  TH-${new Date(order.createdAt).getFullYear()}-${order.id
      .slice(-6)
      .toUpperCase()}
                </strong>
              </p>

              <p>
                Invoice Date:
                ${new Date(
        order.createdAt
      ).toLocaleDateString()}
              </p>

            </td>

            <td align="right">

              <strong>GSTIN</strong><br/>
              19BKDPB6636D1ZE

            </td>

          </tr>
        </table>

        <hr style="
          margin:25px 0;
          border:none;
          border-top:1px solid #eee;
        "/>

        <!-- CUSTOMER -->

        <table width="100%">
          <tr>

            <td width="50%">

              <h3 style="margin-bottom:8px;">
                Bill To
              </h3>

              <p style="
                line-height:1.7;
                margin:0;
              ">
                <strong>
                  ${order.customerName}
                </strong><br/>

                ${order.email}<br/>

                ${order.phone}<br/>

                ${order.address}<br/>

                ${order.city} - ${order.pincode}
              </p>

            </td>

            <td width="50%" align="right">

              <h3 style="margin-bottom:8px;">
                Supplier
              </h3>

              <p style="
                line-height:1.7;
                margin:0;
              ">
                <strong>
                  Tamanna's Hut
                </strong><br/>

                GSTIN:
                19BKDPB6636D1ZE<br/>

                West Bengal, India<br/>

                support@tamannashut.com
              </p>

            </td>

          </tr>
        </table>

        <!-- PRODUCTS -->

        <h3 style="
          margin-top:35px;
          margin-bottom:15px;
        ">
          Order Items
        </h3>

        <table
          width="100%"
          cellpadding="12"
          cellspacing="0"
          style="
            border-collapse:collapse;
            border:1px solid #e5e7eb;
          "
        >

          <thead>

            <tr style="
              background:#f3f4f6;
            ">
              <th align="left">Product</th>
              <th align="center">Size</th>
              <th align="center">Qty</th>
              <th align="right">Price</th>
              <th align="right">Amount</th>
            </tr>

          </thead>

          <tbody>

            ${order.products.map(
        (item) => `
              <tr style="
                border-top:1px solid #e5e7eb;
              ">

                <td>
                  ${item.name}
                </td>

                <td align="center">
                  ${item.selectedSize}
                </td>

                <td align="center">
                  ${item.qty}
                </td>

                <td align="right">
                  ₹${item.price}
                </td>

                <td align="right">
                  ₹${item.price * item.qty}
                </td>

              </tr>
            `
      ).join("")}

          </tbody>

        </table>

        <!-- TOTALS -->

        <table
          width="350"
          align="right"
          style="
            margin-top:30px;
          "
        >

          <tr>
            <td>Taxable Value</td>
            <td align="right">
              ₹${taxableAmount}
            </td>
          </tr>

          <tr>
            <td>CGST (6%)</td>
            <td align="right">
              ₹${cgst}
            </td>
          </tr>

          <tr>
            <td>SGST (6%)</td>
            <td align="right">
              ₹${sgst}
            </td>
          </tr>

          <tr>
            <td colspan="2">
              <hr/>
            </td>
          </tr>

          <tr style="
            font-size:22px;
            font-weight:bold;
            color:#ec4899;
          ">

            <td>Total</td>

            <td align="right">
              ₹${order.totalAmount}
            </td>

          </tr>

        </table>

        <div style="
          clear:both;
        "></div>

        <!-- PAYMENT -->

        <div style="
          margin-top:40px;
          padding:20px;
          background:#fafafa;
          border-radius:10px;
        ">

          <strong>Payment Details</strong>

          <p>
            Payment Method:
            ${order.paymentMethod || "Online"}
          </p>

          <p>
            Payment Status:
            ${order.paymentStatus || "Paid"}
          </p>

          <p>
            Order Status:
            ${order.status || "Processing"}
          </p>

        </div>

      </div>

      <!-- FOOTER -->

      <div style="
        background:#fafafa;
        text-align:center;
        padding:25px;
        color:#6b7280;
        font-size:13px;
      ">

        <strong>
          Thank you for shopping with Tamanna's Hut 💖
        </strong>

        <p>
          Premium Fashion For Babies & Kids
        </p>

        <p>
          www.tamannashut.com
        </p>

        <p>
          support@tamannashut.com
        </p>

        <p style="
          color:#9ca3af;
          margin-top:15px;
        ">
          This is a computer generated GST invoice and does not require a signature.
        </p>

      </div>

    </div>

  </div>
  `;
};