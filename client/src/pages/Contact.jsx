import { Helmet } from "react-helmet-async";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";

const topics = {
  general: "General question",
  order: "Order support",
  delivery: "Delivery and tracking",
  return: "Return or refund",
  payment: "Payment support",
};

function Contact() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(topics[searchParams.get("topic")] ? searchParams.get("topic") : "general");
  const [orderReference, setOrderReference] = useState(searchParams.get("order") || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (!name || !email || !message) {
        toast.error("Please fill all fields");
        return;
      }
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      
      if (!email.trim()) {
        toast.error("Please enter your email");
        return;
      }
      
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email");
        return;
      }
      
      if (!message.trim()) {
        toast.error("Please enter your message");
        return;
      }
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts`,
        {
          name,
          email,
          message: `[Topic: ${topics[topic]}]${orderReference.trim() ? `\n[Order: ${orderReference.trim()}]` : ""}\n\n${message.trim()}`,
        }
      );

      toast.success("Message sent successfully!");

      setName("");
      setEmail("");
      setMessage("");
      setOrderReference("");

    } catch (error) {

      toast.error(error.response?.data?.message || "Failed to send message");

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

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">

        <h1 className="mb-8 text-3xl font-bold sm:mb-10 sm:text-5xl">
          Contact Us
        </h1>

        <p className="-mt-5 mb-8 text-sm text-slate-500 sm:-mt-7 sm:mb-10">Looking for a quick answer? Visit the <Link to="/help" className="font-semibold text-brand-primary underline">Help Centre</Link>.</p>

        <div className="grid gap-8 md:grid-cols-2 md:gap-10">

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Tamanna's Hut
            </h2>

            <p className="mb-3 break-all"><a href="mailto:support@tamannashut.com" className="hover:underline">support@tamannashut.com</a></p>

            <p className="mb-3">
              <a href="tel:+919874328578" className="hover:underline">+91 98743 28578</a>
            </p>
            <p className="mb-3 text-sm leading-6 text-gray-600">Customer support: Monday–Saturday, 10:00 AM–6:00 PM IST. We normally respond within 1–2 business days.</p>
            <address className="mt-5 not-italic leading-7 text-gray-700"><strong>Legal seller: Tamanna Enterprise</strong><br />House No. N0072, Ground Floor<br />Raghudebbati West, Sankrail<br />Howrah, West Bengal 711310, India<br />GSTIN: 19BKDPB6636D1ZE</address>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <label className="field-label">Your name<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field-control mt-2" minLength="2" maxLength="80" autoComplete="name" required /></label>

            <label className="field-label">Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field-control mt-2" maxLength="254" autoComplete="email" required /></label>

            <label className="field-label">Support topic<select value={topic} onChange={(event) => setTopic(event.target.value)} className="field-control mt-2">{Object.entries(topics).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

            {(topic !== "general" || orderReference) && <label className="field-label">Order number <span className="font-normal text-slate-400">(if available)</span><input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} placeholder="Order number shown in My Orders" className="field-control mt-2" maxLength="40" /></label>}

            <label className="field-label">How can we help?<textarea rows="5" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your order or question" className="field-control mt-2" minLength="10" maxLength="1800" required /></label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-primary px-8 py-3 text-white hover:bg-brand-primary-dark sm:w-auto"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>

        </div>
      </main>
    </>
  );
}

export default Contact;
