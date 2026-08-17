import { Helmet } from "react-helmet-async";

function ShippingPolicy() {
  return (
    <>
      <Helmet>
        <title>Shipping Policy | Tamanna's Hut</title>

        <meta
          name="description"
          content="Shipping Policy for Tamanna's Hut."
        />

        <link
          rel="canonical"
          href="https://www.tamannashut.com/shipping-policy"
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Shipping Policy
        </h1>

        <div className="space-y-6 text-gray-700 leading-8">
          <p>
            Tamanna's Hut delivers products across India.
          </p>

          <h2 className="text-2xl font-semibold">
            Processing Time
          </h2>

          <p>Orders are usually processed within 1 business day after order confirmation. Orders placed on Sundays or public holidays are processed on the next business day.</p>

          <h2 className="text-2xl font-semibold">
            Delivery Time
          </h2>

          <p>
            Delivery generally takes 3–7 business days after dispatch, depending on the destination, serviceability and courier conditions. Remote locations may take longer. These are estimates, not guaranteed delivery dates.
          </p>

          <h2 className="text-2xl font-semibold">
            Shipping Charges
          </h2>

          <p>
            Standard shipping is currently free for orders delivered within India. Any future paid shipping option will be clearly displayed before the customer places the order.
          </p>

          <h2 className="text-2xl font-semibold">
            Order Tracking
          </h2>

          <p>
            Customers receive tracking details after dispatch. Please provide a complete address and reachable phone number. If a parcel is returned because of an incorrect address, repeated failed delivery attempts or refusal, contact support before placing a replacement order.
          </p>

          <h2 className="text-2xl font-semibold">
            Contact Us
          </h2>

          <p>
            For delivery questions, email <a className="text-brand-primary underline" href="mailto:support@tamannashut.com">support@tamannashut.com</a> or call <a className="text-brand-primary underline" href="tel:+919874328578">+91 98743 28578</a>.
          </p>
        </div>
      </div>
    </>
  );
}

export default ShippingPolicy;
