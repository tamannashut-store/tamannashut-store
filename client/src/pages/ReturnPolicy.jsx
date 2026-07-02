import { Helmet } from "react-helmet-async";
import Container from "../components/Container";
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
          href="https://tamannashut.com/return-policy"
        />
      </Helmet>

      <Container className="py-20">
        <h1 className="text-4xl font-bold mb-8">
          Return & Exchange Policy
        </h1>

        <div className="space-y-6 text-gray-700 leading-8">
          <p>
            At Tamanna's Hut, customer satisfaction is our priority.
          </p>

          <h2 className="text-2xl font-semibold">
            Returns
          </h2>

          <p>
            We accept returns within 7 days of delivery for both
            defective and non-defective products.
          </p>

          <p>
            Returned items must be unused, unwashed, and in their
            original packaging with all tags attached.
          </p>

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
            please contact us within 48 hours of delivery.
          </p>

          <h2 className="text-2xl font-semibold">
            Refunds
          </h2>

          <p>
            Once the returned item is received and inspected,
            eligible refunds will be processed within 5–7
            business days.
          </p>

          <h2 className="text-2xl font-semibold">
            Contact Us
          </h2>

          <p>
            Email: support@tamannashut.com
            <br />
            Website: https://tamannashut.com
          </p>
        </div>
      </Container>
    </>
  );
}

export default ReturnPolicy;