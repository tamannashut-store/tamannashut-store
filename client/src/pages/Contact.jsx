import { Helmet } from "react-helmet-async";

function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact Us | Tamanna's Hut</title>

        <meta
          name="description"
          content="Contact Tamanna's Hut for support, orders, and inquiries."
        />

        <link
          rel="canonical"
          href="https://tamannashut.com/contact"
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-10">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Tamanna's Hut
            </h2>

            <p className="mb-4">
              Premium Fashion For Kids
            </p>

            <p className="mb-3">
              📧 Email: support@tamannashut.com
            </p>

            <p className="mb-3">
              📞 Phone: +91 XXXXX XXXXX
            </p>

            <p className="mb-3">
              📍 India
            </p>
          </div>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full border p-4 rounded-xl"
            />

            <input
              type="email"
              placeholder="Your Email"
              className="w-full border p-4 rounded-xl"
            />

            <textarea
              rows="5"
              placeholder="Your Message"
              className="w-full border p-4 rounded-xl"
            />

            <button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Contact;