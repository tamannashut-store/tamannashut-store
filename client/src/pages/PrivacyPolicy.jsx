import { Helmet } from "react-helmet-async";

function PrivacyPolicy() {
    return (
        <>
            <Helmet>
                <title>Privacy Policy | Tamanna's Hut</title>

                <meta
                    name="description"
                    content="Privacy Policy for Tamanna's Hut."
                />

                <link
                    rel="canonical"
                    href="https://www.tamannashut.com/privacy-policy"
                />
            </Helmet>

            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold mb-8">
                    Privacy Policy
                </h1>

                <div className="space-y-6 text-gray-700 leading-8">
                    <p>
                        Tamanna's Hut values your privacy and is committed
                        to protecting your personal information.
                    </p>

                    <h2 className="text-2xl font-semibold">
                        Information We Collect
                    </h2>

                    <p>
                        We may collect your name, email address, phone number,
                        shipping address and payment information when you place
                        an order.
                    </p>

                    <h2 className="text-2xl font-semibold">
                        How We Use Information
                    </h2>

                    <p>
                        We use your information to process orders, provide
                        customer support and improve our services.
                    </p>

                    <h2 className="text-2xl font-semibold">Service Providers</h2>
                    <p>We share only the information needed to fulfil orders or operate the store with service providers such as payment processors, delivery partners, website hosting and customer-support providers. We do not sell customer personal information.</p>

                    <h2 className="text-2xl font-semibold">
                        Data Security
                    </h2>

                    <p>
                        We take reasonable measures to protect customer data
                        from unauthorized access or disclosure.
                    </p>

                    <h2 className="text-2xl font-semibold">
                        Contact Us
                    </h2>

                    <p>
                        This website is operated by Tamanna Enterprise. For privacy questions or requests, email <a className="text-brand-primary underline" href="mailto:support@tamannashut.com">support@tamannashut.com</a> or call <a className="text-brand-primary underline" href="tel:+919874328578">+91 98743 28578</a>.
                    </p>
                </div>
            </div>
        </>
    );
}

export default PrivacyPolicy;
