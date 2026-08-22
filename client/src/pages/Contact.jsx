import { useState } from "react";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiClock, FiMail, FiMessageSquare, FiPhone, FiShield } from "react-icons/fi";

const topics = {
  general: "General question",
  order: "Order support",
  delivery: "Delivery and tracking",
  return: "Return or refund",
  payment: "Payment support",
};
const savedCustomer = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null")?.user || {}; }
  catch { return {}; }
};

function Contact() {
  const [searchParams] = useSearchParams();
  const [initialUser] = useState(savedCustomer);
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(topics[searchParams.get("topic")] ? searchParams.get("topic") : "general");
  const [orderReference, setOrderReference] = useState(searchParams.get("order") || "");
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmission(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();
    if (cleanName.length < 2) return setSubmission({ type: "error", message: "Please enter your full name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setSubmission({ type: "error", message: "Please enter a valid email address." });
    if (cleanMessage.length < 10) return setSubmission({ type: "error", message: "Please describe how we can help in at least 10 characters." });
    try {
      setLoading(true);
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/contacts`, { name: cleanName, email: cleanEmail, topic, orderReference: orderReference.trim(), message: cleanMessage });
      setSubmission({ type: "success", message: "Your support request has been sent.", reference: data.reference });
      setMessage("");
      setOrderReference("");
      toast.success("Support request sent");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Your request could not be sent. Please try again.";
      setSubmission({ type: "error", message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
    <Helmet><title>Contact Support | Tamanna&apos;s Hut</title><meta name="description" content="Contact Tamanna's Hut support for orders, delivery, payments and returns."/><link rel="canonical" href="https://www.tamannashut.com/contact"/></Helmet>
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link to="/" className="hover:text-brand-primary hover:underline">Home</Link><span aria-hidden="true" className="mx-2">/</span><Link to="/help" className="hover:text-brand-primary hover:underline">Help Centre</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page">Contact support</span></nav>

    <header className="max-w-3xl"><p className="eyebrow">Customer care</p><h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Contact our support team</h1><p className="mt-4 text-base leading-7 text-slate-600">Tell us what happened and we&apos;ll send you a support reference. Looking for an immediate answer? Start in the <Link to="/help" className="font-semibold text-brand-primary underline underline-offset-4">Help Centre</Link>.</p></header>

    <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-10">
      <aside className="space-y-4">
        <section className="rounded-3xl bg-[#123b29] p-6 text-white sm:p-7"><h2 className="text-xl font-bold">Talk to Tamanna&apos;s Hut</h2><div className="mt-6 space-y-4"><a href="tel:+919874328578" className="flex min-h-16 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 hover:bg-white/15"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-primary"><FiPhone aria-hidden="true"/></span><span><span className="block text-xs uppercase tracking-wider text-white/60">Call us</span><span className="mt-1 block font-semibold">+91 98743 28578</span></span></a><a href="mailto:support@tamannashut.com" className="flex min-h-16 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 hover:bg-white/15"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-primary"><FiMail aria-hidden="true"/></span><span className="min-w-0"><span className="block text-xs uppercase tracking-wider text-white/60">Email us</span><span className="mt-1 block break-all font-semibold">support@tamannashut.com</span></span></a></div></section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">What happens next?</h2><ol className="mt-5 space-y-4 text-sm text-slate-600"><li className="flex gap-3"><FiMessageSquare aria-hidden="true" className="mt-1 shrink-0 text-brand-primary"/><span>We save your request and issue a reference number.</span></li><li className="flex gap-3"><FiClock aria-hidden="true" className="mt-1 shrink-0 text-brand-primary"/><span>Our team normally responds within 1–2 business days.</span></li><li className="flex gap-3"><FiShield aria-hidden="true" className="mt-1 shrink-0 text-brand-primary"/><span>Never include passwords, OTPs or complete bank details.</span></li></ol></section>
        <address className="rounded-3xl border border-slate-200 bg-white p-6 text-sm not-italic leading-6 text-slate-600"><strong className="text-slate-900">Tamanna Enterprise</strong><br/>House No. N0072, Ground Floor<br/>Raghudebbati West, Sankrail<br/>Howrah, West Bengal 711310, India<br/><span className="mt-2 block">GSTIN: 19BKDPB6636D1ZE</span></address>
      </aside>

      <section aria-labelledby="support-form-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
        <div className="border-b border-slate-100 pb-6"><h2 id="support-form-heading" className="text-2xl font-bold">Send a secure request</h2><p className="mt-2 text-sm text-slate-500">Support hours: Monday–Saturday, 10:00 AM–6:00 PM IST.</p></div>
        {submission && <div role={submission.type === "error" ? "alert" : "status"} aria-live="polite" className={`mt-6 rounded-2xl border p-4 ${submission.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}><div className="flex items-start gap-3">{submission.type === "success" && <FiCheckCircle aria-hidden="true" className="mt-0.5 shrink-0 text-xl"/>}<div><p className="font-semibold">{submission.message}</p>{submission.reference && <p className="mt-1 text-sm">Support reference: <strong className="font-mono">{submission.reference}</strong>. Keep this number for follow-up.</p>}</div></div></div>}
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="field-label">Your name<input type="text" value={name} onChange={(event) => setName(event.target.value)} className="field-control mt-2" minLength="2" maxLength="80" autoComplete="name" required/></label>
          <label className="field-label">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-control mt-2" maxLength="254" autoComplete="email" required/></label>
          <label className="field-label">Support topic<select value={topic} onChange={(event) => setTopic(event.target.value)} className="field-control mt-2">{Object.entries(topics).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {(topic !== "general" || orderReference) ? <label className="field-label">Order number <span className="font-normal text-slate-400">(if available)</span><input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} placeholder="Shown in My Orders" className="field-control mt-2" maxLength="40" autoComplete="off"/></label> : <div className="hidden sm:block"/>}
          <label className="field-label sm:col-span-2">How can we help?<textarea rows="7" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe the issue, what you expected and any relevant details" className="field-control mt-2 resize-y" minLength="10" maxLength="1800" aria-describedby="message-count" required/><span id="message-count" className="mt-2 block text-right text-xs font-normal text-slate-400">{message.length} / 1800 characters</span></label>
          <div className="sm:col-span-2"><button type="submit" disabled={loading} className="btn-primary min-h-12 w-full sm:w-auto sm:min-w-48 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Sending request…" : "Send support request"}</button><p className="mt-3 text-xs leading-5 text-slate-500">By sending this form, you agree that we may use these details to respond under our <Link to="/privacy-policy" className="font-semibold text-brand-primary underline">Privacy Policy</Link>.</p></div>
        </form>
      </section>
    </div>
  </main>;
}

export default Contact;
