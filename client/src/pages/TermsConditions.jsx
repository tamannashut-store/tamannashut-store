import { Helmet } from "react-helmet-async";
import Container from "../components/Container";

function TermsConditions() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | Tamanna's Hut</title>

        <meta
          name="description"
          content="Terms and Conditions for Tamanna's Hut."
        />

        <link
          rel="canonical"
          href="https://tamannashut.com/terms-and-conditions"
        />
      </Helmet>

      <Container className="py-20">
        <h1 className="text-4xl font-bold mb-8">
          Terms & Conditions
        </h1>

        <div className="space-y-6 text-gray-700 leading-8">
          <p>
            Welcome to Tamanna's Hut. By using our website,
            you agree to the following terms and conditions.
          </p>

          <h2 className="text-2xl font-semibold">
            Products & Pricing
          </h2>

          <p>
            We strive to ensure all product descriptions,
            images and prices are accurate. However, errors
            may occur and we reserve the right to correct them.
          </p>

          <h2 className="text-2xl font-semibold">
            Orders
          </h2>

          <p>
            All orders are subject to availability and
            confirmation of payment.
          </p>

          <h2 className="text-2xl font-semibold">
            Shipping
          </h2>

          <p>
            Delivery times are estimates and may vary based
            on location and courier services.
          </p>

          <h2 className="text-2xl font-semibold">
            Returns & Refunds
          </h2>

          <p>
            Returns and refunds are governed by our
            Return Policy available on this website.
          </p>

          <h2 className="text-2xl font-semibold">
            Intellectual Property
          </h2>

          <p>
            All content, logos, images and branding on
            Tamanna's Hut are the property of Tamanna's Hut.
          </p>

          <h2 className="text-2xl font-semibold">
            Contact
          </h2>

          <p>
            Email: support@tamannashut.com
          </p>
        </div>
      </Container>
    </>
  );
}

export default TermsConditions;