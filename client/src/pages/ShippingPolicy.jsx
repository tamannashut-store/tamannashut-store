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
          href="https://tamannashut.com/shipping-policy"
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

          <p>
            Orders are usually processed within 1 business day.
          </p>

          <h2 className="text-2xl font-semibold">
            Delivery Time
          </h2>

          <p>
            Delivery generally takes 3–7 business days depending
            on the destination and courier availability.
          </p>

          <h2 className="text-2xl font-semibold">
            Shipping Charges
          </h2>

          <p>
            Shipping charges, if applicable, are displayed during checkout.
          </p>

          <h2 className="text-2xl font-semibold">
            Order Tracking
          </h2>

          <p>
            Customers will receive tracking details once the order
            has been dispatched.
          </p>

          <h2 className="text-2xl font-semibold">
            Contact Us
          </h2>

          <p>
            Email: support@tamannashut.com
          </p>
        </div>
      </div>
    </>
  );
}

export default ShippingPolicy;