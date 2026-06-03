import { Helmet } from "react-helmet-async";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function Contact() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (!name || !email || !message) {
        toast.error("Please fill all fields");
        return;
      }
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contact`,
        {
          name,
          email,
          message,
        }
      );

      toast.success("Message sent successfully!");

      setName("");
      setEmail("");
      setMessage("");

    } catch (error) {

      console.log(error);

      toast.error("Failed to send message");

    } finally {

      setLoading(false);

    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Tamanna's Hut</title>
        <meta
          name="description"
          content="Contact Tamanna's Hut for support, orders, and inquiries."
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

            <p className="mb-3">
              📧 support@tamannashut.com
            </p>

            <p className="mb-3">
              📞 +91 9874328578
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full border p-4 rounded-xl"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="w-full border p-4 rounded-xl"
              required
            />

            <textarea
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your Message"
              className="w-full border p-4 rounded-xl"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>

        </div>
      </div>
    </>
  );
}

export default Contact;