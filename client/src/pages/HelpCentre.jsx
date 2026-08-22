import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FiChevronDown, FiMail, FiPackage, FiRefreshCw, FiSearch, FiShield, FiTruck } from "react-icons/fi";

const sections = [
  {
    title: "Orders and delivery",
    icon: FiPackage,
    questions: [
      ["Where can I see my order?", "Sign in and open My Orders to see the current status, order activity, invoice and shipment information."],
      ["When will tracking appear?", "The courier name and AWB tracking number appear after the parcel is dispatched. You can then open Shiprocket tracking directly from My Orders."],
      ["Can I change my delivery address?", "Contact support immediately with your order number. An address cannot be changed after the shipment has been handed to the courier."],
    ],
  },
  {
    title: "Payments and discounts",
    icon: FiShield,
    questions: [
      ["When is a COD order paid?", "Cash-on-delivery payment remains pending until successful delivery. Placing a COD order does not mean payment has already been collected."],
      ["How does the first-order offer work?", "An eligible new customer receives the welcome offer after phone verification. The final discount is calculated securely during checkout and cannot be combined with a better coupon."],
      ["What if an online payment succeeds but the order is missing?", "Do not pay again. Contact support with the payment time, account email and payment reference so the transaction can be checked."],
    ],
  },
  {
    title: "Returns and refunds",
    icon: FiRefreshCw,
    questions: [
      ["How do I request a return?", "For an eligible delivered order, open My Orders and choose Request return. Explain the issue clearly and add photographs when the item is damaged, incorrect or incomplete."],
      ["How long do refunds take?", "After an approved return is received and inspected, an eligible refund is normally initiated within 5–7 business days. Your bank or payment provider may need additional time."],
      ["How is a COD refund paid?", "Support will request suitable bank or UPI details through an official channel after the return is approved. Never post sensitive bank details in a public message."],
    ],
  },
  {
    title: "Products and accounts",
    icon: FiTruck,
    questions: [
      ["How do I choose the correct size and colour?", "Select a colour first, review its matching photographs, then choose an available size. The cart and checkout show the exact selected variation."],
      ["Why is a size unavailable?", "Stock is maintained separately for every colour and size combination. An unavailable option has no sellable stock at that moment."],
      ["How do I delete my account?", "Open Profile and use Delete account. Active orders, returns or refunds must be completed first, and legally required order records are retained for invoices and compliance."],
    ],
  },
];

export default function HelpCentre() {
  const [query, setQuery] = useState("");
  const visibleSections = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sections;
    return sections.map((section) => ({
      ...section,
      questions: section.questions.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(search)),
    })).filter((section) => section.questions.length);
  }, [query]);

  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
    <Helmet><title>Help Centre | Tamanna&apos;s Hut</title><meta name="description" content="Get help with Tamanna's Hut orders, delivery, payments, returns and accounts."/><link rel="canonical" href="https://www.tamannashut.com/help"/></Helmet>
    <header className="rounded-3xl bg-[#123b29] px-5 py-10 text-white sm:px-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Customer support</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">How can we help?</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">Find quick answers about shopping, tracking, returns and your account.</p>
      <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-sm"><FiSearch className="shrink-0 text-xl text-brand-primary"/><span className="sr-only">Search help articles</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search orders, refunds, delivery…" className="min-w-0 flex-1 bg-transparent outline-none"/></label>
    </header>

    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {visibleSections.map(({ title, icon: Icon, questions }) => <section key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-xl text-brand-primary"><Icon/></span><h2 className="text-xl font-bold">{title}</h2></div>
        <div className="mt-5 divide-y divide-slate-100">{questions.map(([question, answer]) => <details key={question} className="group py-1"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-semibold"><span>{question}</span><FiChevronDown className="shrink-0 transition group-open:rotate-180"/></summary><p className="pb-4 pr-8 text-sm leading-6 text-slate-600">{answer}</p></details>)}</div>
      </section>)}
    </div>

    {!visibleSections.length && <section className="mt-10 rounded-3xl border bg-white px-5 py-14 text-center"><h2 className="text-xl font-bold">No matching help article</h2><p className="mt-2 text-slate-500">Try another phrase or send our support team a message.</p></section>}

    <section className="mt-10 grid gap-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
      <div><h2 className="text-2xl font-bold">Still need help?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Include your order number when asking about an existing purchase. Support is available Monday–Saturday, 10:00 AM–6:00 PM IST.</p></div>
      <div className="flex flex-wrap gap-3"><Link to="/my-orders" className="btn-secondary">My orders</Link><Link to="/contact" className="btn-primary"><FiMail/> Contact support</Link></div>
    </section>
  </main>;
}
