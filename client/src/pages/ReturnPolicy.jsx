import { Helmet } from "react-helmet-async";

function ReturnPolicy() {
  return (
    <>
      <Helmet>
        <title>Return Policy | Tamanna's Hut</title>
        <meta
          name="description"
          content="Return and Exchange Policy for Tamanna's Hut."
        />
        <link
          rel="canonical"
          href="https://www.tamannashut.com/return-policy"
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Return & Exchange Policy
        </h1>

        <div className="space-y-6 text-gray-700 leading-8">
          <p>
            At Tamanna's Hut, customer satisfaction is our priority.
          </p>

          <p>Last updated: 18 August 2026</p>

          <h2 className="text-2xl font-semibold">Returns</h2>

          <p>
            We accept returns within 7 days of delivery for both
            defective and non-defective products.
          </p>

          <p>
            Returned items must be unused, unwashed, and in their
            original packaging with all tags attached. For hygiene and safety, an item that has been worn, washed, altered, stained or damaged after delivery is not eligible unless it arrived defective.
          </p>

          <h2 className="text-2xl font-semibold">How to request a return</h2>
          <p>Email <a className="text-brand-primary underline" href="mailto:support@tamannashut.com">support@tamannashut.com</a> within 7 days of delivery with your order number, item, reason and photographs where relevant. Do not send an item before receiving return instructions. We will confirm eligibility and provide the return address or pickup instructions.</p>

          <h2 className="text-2xl font-semibold">
            Exchanges
          </h2>

          <p>
            We accept size exchanges subject to stock availability.
          </p>

          <h2 className="text-2xl font-semibold">
            Damaged or Incorrect Products
          </h2>

          <p>
            If you receive a damaged, defective, or incorrect item,
            please contact us within 48 hours of delivery with clear photographs. Tamanna Enterprise will bear the approved return shipping cost for a damaged, defective or incorrect item. For a non-defective return or size exchange, the customer bears the return shipping cost.
          </p>

          <h2 className="text-2xl font-semibold">
            Refunds
          </h2>

          <p>
            Once the returned item is received and inspected, eligible refunds will be initiated within 5–7 business days. Prepaid orders are refunded to the original payment method. For cash-on-delivery orders, we will request bank or UPI details through our official support channel. Banks and payment providers may require additional time to credit the refund.
          </p>

          <h2 className="text-2xl font-semibold">Cancellations</h2>
          <p>To request cancellation, contact us as soon as possible with your order number. An order can be cancelled before it is dispatched. After dispatch, it must follow the return process above. If Tamanna Enterprise cancels an order that was prepaid, the full amount will be refunded to the original payment method.</p>

          <h2 className="text-2xl font-semibold">
            Contact Us
          </h2>

          <p>
            Tamanna Enterprise<br />Email: <a className="text-brand-primary underline" href="mailto:support@tamannashut.com">support@tamannashut.com</a><br />Phone: <a className="text-brand-primary underline" href="tel:+919874328578">+91 98743 28578</a><br />House No. N0072, Ground Floor, Raghudebbati West, Sankrail, Howrah, West Bengal 711310
          </p>
        </div>
      </div>
    </>
  );
}

export default ReturnPolicy;
