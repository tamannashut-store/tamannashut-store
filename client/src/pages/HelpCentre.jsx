import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronDown, FiClock, FiMail, FiPackage, FiPhone, FiRefreshCw, FiSearch, FiShield, FiTruck, FiUser, FiX } from "react-icons/fi";

const sections = [
  {
    id: "orders", title: "Orders and delivery", shortTitle: "Orders", topic: "order", icon: FiPackage,
    questions: [
      { id: "find-order", question: "Where can I see my order?", answer: "Sign in and open My Orders to see the current status, order activity, invoice and shipment information.", keywords: "track history invoice status" },
      { id: "tracking-appear", question: "When will tracking appear?", answer: "The courier name and AWB tracking number appear after the parcel is dispatched. You can then open Shiprocket tracking directly from My Orders.", keywords: "awb courier dispatch shipment" },
      { id: "change-address", question: "Can I change my delivery address?", answer: "Contact support immediately with your order number. An address cannot be changed after the shipment has been handed to the courier.", keywords: "edit wrong address pincode" },
      { id: "cancel-order", question: "Can I cancel an order?", answer: "Pending or confirmed orders can be cancelled from My Orders. Once packing or shipping has started, contact support so the available options can be checked.", keywords: "stop cancellation" },
    ],
  },
  {
    id: "payments", title: "Payments and discounts", shortTitle: "Payments", topic: "payment", icon: FiShield,
    questions: [
      { id: "cod-paid", question: "When is a COD order paid?", answer: "Cash-on-delivery payment remains pending until successful delivery. Placing a COD order does not mean payment has already been collected.", keywords: "cash delivery pending collected" },
      { id: "welcome-offer", question: "How does the first-order offer work?", answer: "An eligible new customer receives the welcome offer after phone verification. The final discount is calculated securely during checkout and cannot be combined with a better coupon.", keywords: "new customer 10 percent phone coupon" },
      { id: "missing-online-order", question: "What if an online payment succeeds but the order is missing?", answer: "Do not pay again. Contact support with the payment time, account email and payment reference so the transaction can be checked.", keywords: "razorpay charged failed duplicate" },
      { id: "coupon-failed", question: "Why was my coupon not applied?", answer: "Check the coupon expiry, minimum order value and eligible products. Checkout automatically keeps the best valid discount when offers cannot be combined.", keywords: "promo discount invalid" },
    ],
  },
  {
    id: "returns", title: "Returns and refunds", shortTitle: "Returns", topic: "return", icon: FiRefreshCw,
    questions: [
      { id: "request-return", question: "How do I request a return?", answer: "For an eligible delivered order, open My Orders and choose Request return. Explain the issue clearly and add photographs when the item is damaged, incorrect or incomplete.", keywords: "exchange damaged wrong item photo" },
      { id: "refund-time", question: "How long do refunds take?", answer: "After an approved return is received and inspected, an eligible refund is normally initiated within 5–7 business days. Your bank or payment provider may need additional time.", keywords: "money credit processing days" },
      { id: "cod-refund", question: "How is a COD refund paid?", answer: "Support will request suitable bank or UPI details through an official channel after the return is approved. Never post sensitive bank details in a public message.", keywords: "cash refund bank upi" },
      { id: "return-eligibility", question: "Which items are eligible for return?", answer: "Eligibility depends on the return window, item condition and the reason selected. Review the Returns, refunds and cancellations policy before submitting a request.", keywords: "window condition policy" },
    ],
  },
  {
    id: "products", title: "Products and accounts", shortTitle: "Products & account", topic: "general", icon: FiUser,
    questions: [
      { id: "choose-variation", question: "How do I choose the correct size and colour?", answer: "Select a colour first, review its matching photographs, then choose an available size. The cart and checkout show the exact selected variation.", keywords: "variant image fit" },
      { id: "size-unavailable", question: "Why is a size unavailable?", answer: "Stock is maintained separately for every colour and size combination. An unavailable option has no sellable stock at that moment.", keywords: "out of stock inventory" },
      { id: "account-password", question: "How do I reset my password?", answer: "Choose Forgot password on the customer sign-in page. If the email belongs to an account, a secure reset link valid for 30 minutes will be sent.", keywords: "login sign in recovery email" },
      { id: "delete-account", question: "How do I delete my account?", answer: "Open Profile and use Delete account. Active orders, returns or refunds must be completed first, and legally required order records are retained for invoices and compliance.", keywords: "privacy remove profile" },
    ],
  },
];

const quickActions = [
  { title: "Track an order", copy: "Status, invoice and AWB", to: "/my-orders", icon: FiTruck },
  { title: "Start a return", copy: "Review eligibility and steps", to: "/return-policy", icon: FiRefreshCw },
  { title: "Payment support", copy: "Get help with a transaction", to: "/contact?topic=payment", icon: FiShield },
  { title: "Manage account", copy: "Address, phone and security", to: "/profile", icon: FiUser },
];

const faqSchema = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: sections.flatMap((section) => section.questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }))),
};

export default function HelpCentre() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openQuestions, setOpenQuestions] = useState(new Set());
  const visibleSections = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sections.filter((section) => category === "all" || section.id === category).map((section) => ({ ...section, questions: section.questions.filter(({ question, answer, keywords }) => !search || `${question} ${answer} ${keywords}`.toLowerCase().includes(search)) })).filter((section) => section.questions.length);
  }, [category, query]);
  const visibleIds = visibleSections.flatMap((section) => section.questions.map((question) => question.id));
  const resultCount = visibleIds.length;
  const allExpanded = resultCount > 0 && visibleIds.every((id) => openQuestions.has(id));
  const toggleQuestion = (id) => setOpenQuestions((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const resetSearch = () => { setQuery(""); setCategory("all"); };

  return <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
    <Helmet><title>Help Centre | Tamanna&apos;s Hut</title><meta name="description" content="Get accessible help with Tamanna's Hut orders, delivery, payments, returns and accounts."/><link rel="canonical" href="https://www.tamannashut.com/help"/><script type="application/ld+json">{JSON.stringify(faqSchema)}</script></Helmet>
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link to="/" className="hover:text-brand-primary hover:underline">Home</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page">Help Centre</span></nav>

    <header className="overflow-hidden rounded-[2rem] bg-[#123b29] text-white shadow-xl shadow-emerald-950/10">
      <div className="grid gap-8 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_320px] lg:items-end lg:px-14">
        <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Customer support</p><h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">How can we help?</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">Search clear answers, manage an order or contact a real person when you need more help.</p>
          <label htmlFor="help-search" className="sr-only">Search help articles</label><div className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl bg-white px-4 py-2 text-slate-900 shadow-lg"><FiSearch aria-hidden="true" className="shrink-0 text-xl text-brand-primary"/><input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search orders, refunds, delivery…" className="min-w-0 flex-1 border-0 bg-transparent py-2 outline-none"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear help search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><FiX aria-hidden="true"/></button>}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><div className="flex items-center gap-3"><FiClock aria-hidden="true" className="text-xl text-emerald-200"/><div><p className="font-semibold">Support hours</p><p className="text-sm text-white/70">Mon–Sat, 10 AM–6 PM IST</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><a href="tel:+919874328578" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-[#123b29]"><FiPhone aria-hidden="true"/> Call</a><a href="mailto:support@tamannashut.com" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-3 text-sm font-semibold text-white"><FiMail aria-hidden="true"/> Email</a></div></div>
      </div>
    </header>

    <section aria-labelledby="popular-help" className="mt-10"><p className="eyebrow">Popular tasks</p><h2 id="popular-help" className="mt-2 text-2xl font-bold sm:text-3xl">Get things done quickly</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickActions.map(({ title, copy, to, icon: Icon }) => <Link key={title} to={to} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xl text-brand-primary"><Icon aria-hidden="true"/></span><span className="min-w-0"><span className="block font-bold text-slate-900">{title}</span><span className="mt-1 block text-sm text-slate-500">{copy}</span></span><FiArrowRight aria-hidden="true" className="ml-auto shrink-0 text-brand-primary transition group-hover:translate-x-1"/></Link>)}</div></section>

    <section id="faq-results" aria-labelledby="faq-heading" className="mt-12 scroll-mt-28"><div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start"><fieldset className="min-w-0"><legend className="text-sm font-bold text-slate-900">Browse by topic</legend><div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible"><button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`min-h-11 shrink-0 rounded-xl px-4 text-left text-sm font-semibold ${category === "all" ? "bg-brand-primary text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}>All topics</button>{sections.map(({ id, shortTitle, icon: Icon }) => <button key={id} type="button" onClick={() => setCategory(id)} aria-pressed={category === id} className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold ${category === id ? "bg-brand-primary text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}><Icon aria-hidden="true"/>{shortTitle}</button>)}</div></fieldset></aside>
      <div className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5"><div><p className="eyebrow">Frequently asked questions</p><h2 id="faq-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Answers for every step</h2><p role="status" aria-live="polite" className="mt-2 text-sm text-slate-500">{resultCount} answer{resultCount === 1 ? "" : "s"} available</p></div>{resultCount > 0 && <button type="button" onClick={() => setOpenQuestions((current) => { const next = new Set(current); if (allExpanded) visibleIds.forEach((id) => next.delete(id)); else visibleIds.forEach((id) => next.add(id)); return next; })} className="btn-secondary min-h-11 text-sm">{allExpanded ? "Collapse all" : "Expand all"}</button>}</div>
        <div className="mt-5 space-y-5">{visibleSections.map(({ id, title, topic, icon: Icon, questions }) => <section key={id} aria-labelledby={`${id}-heading`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-brand-primary"><Icon aria-hidden="true"/></span><h3 id={`${id}-heading`} className="text-lg font-bold">{title}</h3></div><div className="divide-y divide-slate-100">{questions.map(({ id: questionId, question, answer }) => { const open = openQuestions.has(questionId); return <article key={questionId}><h4><button type="button" onClick={() => toggleQuestion(questionId)} aria-expanded={open} aria-controls={`${questionId}-answer`} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900 hover:bg-emerald-50/40 sm:px-6"><span>{question}</span><FiChevronDown aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}/></button></h4>{open && <div id={`${questionId}-answer`} className="px-5 pb-5 sm:px-6"><p className="max-w-3xl text-sm leading-7 text-slate-600">{answer}</p><Link to={`/contact?topic=${topic}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline">Ask about this topic <FiArrowRight aria-hidden="true"/></Link></div>}</article>; })}</div></section>)}</div>
        {!visibleSections.length && <section className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><FiSearch aria-hidden="true" className="mx-auto text-3xl text-slate-400"/><h3 className="mt-4 text-xl font-bold">No matching answer</h3><p className="mt-2 text-slate-500">Try a shorter phrase, browse all topics or contact our support team.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={resetSearch} className="btn-secondary">Clear filters</button><Link to="/contact" className="btn-primary">Contact support</Link></div></section>}
      </div>
    </div></section>

    <section className="mt-12 grid gap-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">Personal support</p><h2 className="mt-2 text-2xl font-bold">Still need help?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Send a secure support request and keep the reference number. Include your order number when asking about an existing purchase.</p></div><div className="flex flex-wrap gap-3"><Link to="/my-orders" className="btn-secondary">My orders</Link><Link to="/contact" className="btn-primary"><FiMail aria-hidden="true"/> Contact support</Link></div></section>
  </main>;
}
