import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCheckCircle, FiClock, FiMail, FiMessageSquare, FiPlus, FiSend } from "react-icons/fi";

const topicLabels = { general: "General question", order: "Order support", delivery: "Delivery and tracking", return: "Return or refund", payment: "Payment support" };
const statusLabels = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
const statusStyles = { open: "bg-amber-50 text-amber-800", in_progress: "bg-blue-50 text-blue-800", resolved: "bg-emerald-50 text-emerald-800" };
const referenceFor = (ticket) => String(ticket?._id || "").slice(-8).toUpperCase();
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const hasUnreadReply = (ticket) => {
  const lastAdminReply = [...(ticket.replies || [])].reverse().find((reply) => reply.sender === "admin");
  return Boolean(lastAdminReply && (!ticket.customerLastReadAt || new Date(lastAdminReply.createdAt) > new Date(ticket.customerLastReadAt)));
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    const loadTickets = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/mine`);
        if (!active) return;
        const next = Array.isArray(data) ? data : [];
        if (next[0]?._id) {
          const { data: opened } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/mine/${next[0]._id}`);
          if (!active) return;
          setTickets([opened, ...next.slice(1)]);
          setActiveId(opened._id);
        } else {
          setTickets([]);
          setActiveId("");
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Your support requests could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTickets();
    return () => { active = false; };
  }, []);

  const activeTicket = useMemo(() => tickets.find((ticket) => ticket._id === activeId) || null, [activeId, tickets]);
  const unreadCount = tickets.filter(hasUnreadReply).length;

  const openTicket = async (ticket) => {
    setActiveId(ticket._id);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/mine/${ticket._id}`);
      setTickets((current) => current.map((item) => item._id === ticket._id ? data : item));
    } catch (requestError) { toast.error(requestError.response?.data?.message || "Support request could not be opened"); }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const message = reply.trim();
    if (message.length < 2) return toast.error("Write a short reply before sending");
    setSending(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/contacts/mine/${activeId}/replies`, { message });
      setTickets((current) => [data, ...current.filter((item) => item._id !== data._id)]);
      setReply("");
      toast.success("Reply sent securely");
    } catch (requestError) { toast.error(requestError.response?.data?.message || "Reply could not be sent"); }
    finally { setSending(false); }
  };

  if (loading) return <main className="grid min-h-[55vh] place-items-center text-sm font-medium text-slate-500">Loading support requests…</main>;

  return <main className="bg-[#f7f6f2]"><div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-brand-primary">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Support requests</span></nav>
    <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end"><div><p className="eyebrow">Your account</p><h1 className="mt-2 font-serif text-4xl text-slate-950 sm:text-5xl">Support requests</h1><p className="mt-3 max-w-2xl text-slate-600">Review replies, continue a conversation, and keep every support reference in one secure place.</p></div><Link to="/contact" className="btn-primary shrink-0"><FiPlus aria-hidden="true"/> New request</Link></header>

    {error ? <section role="alert" className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"><p className="font-semibold">Support requests unavailable</p><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 font-semibold underline">Try again</button></section> : tickets.length === 0 ? <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl text-brand-primary"><FiMessageSquare aria-hidden="true"/></span><h2 className="mt-5 text-2xl font-bold">No support requests yet</h2><p className="mx-auto mt-2 max-w-lg text-slate-500">When you contact us while signed in, the request and every reply will appear here.</p><Link to="/contact" className="btn-primary mt-6">Contact support</Link></section> : <div className="mt-7 grid min-w-0 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">All requests</h2>{unreadCount > 0 && <span className="rounded-full bg-brand-primary px-2.5 py-1 text-xs font-bold text-white">{unreadCount} new</span>}</div><p className="mt-1 text-sm text-slate-500">{tickets.length} request{tickets.length === 1 ? "" : "s"}</p></div><div className="max-h-[68vh] overflow-y-auto divide-y divide-slate-100">{tickets.map((ticket) => { const selected = ticket._id === activeId; const unread = hasUnreadReply(ticket); return <button key={ticket._id} type="button" onClick={() => openTicket(ticket)} aria-pressed={selected} className={`w-full px-5 py-5 text-left transition ${selected ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-bold text-brand-primary">#{referenceFor(ticket)}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[ticket.status || "open"]}`}>{statusLabels[ticket.status || "open"]}</span></div><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{topicLabels[ticket.topic || "general"]}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{ticket.replies?.at(-1)?.body || ticket.message}</p></div>{unread && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" aria-label="New reply"/>}</div><p className="mt-3 text-xs text-slate-400">Updated {dateTime(ticket.lastActivityAt || ticket.createdAt)}</p></button>; })}</div></aside>

      {activeTicket && <section aria-labelledby="ticket-heading" className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 px-5 py-5 sm:px-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs font-bold text-brand-primary">SUPPORT #{referenceFor(activeTicket)}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[activeTicket.status || "open"]}`}>{statusLabels[activeTicket.status || "open"]}</span></div><h2 id="ticket-heading" className="mt-3 text-2xl font-bold">{topicLabels[activeTicket.topic || "general"]}</h2>{activeTicket.orderReference && <p className="mt-2 text-sm text-slate-500">Order <span className="font-mono font-semibold text-slate-700">{activeTicket.orderReference}</span></p>}</div><Link to="/help" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"><FiArrowLeft aria-hidden="true"/> Help Centre</Link></div></header>
        <div className="space-y-5 bg-slate-50/60 px-4 py-6 sm:px-7"><article className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-[#183d2b] p-4 text-white sm:max-w-[78%]"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60"><FiMail aria-hidden="true"/> You</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{activeTicket.message}</p><time className="mt-3 block text-xs text-white/50">{dateTime(activeTicket.createdAt)}</time></article>{(activeTicket.replies || []).map((item) => <article key={item._id || `${item.sender}-${item.createdAt}`} className={`max-w-[90%] rounded-2xl p-4 sm:max-w-[78%] ${item.sender === "admin" ? "mr-auto rounded-bl-md border border-slate-200 bg-white text-slate-800" : "ml-auto rounded-br-md bg-[#183d2b] text-white"}`}><div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${item.sender === "admin" ? "text-brand-primary" : "text-white/60"}`}>{item.sender === "admin" ? <FiCheckCircle aria-hidden="true"/> : <FiMail aria-hidden="true"/>}{item.sender === "admin" ? "Tamanna's Hut support" : "You"}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{item.body}</p><time className={`mt-3 block text-xs ${item.sender === "admin" ? "text-slate-400" : "text-white/50"}`}>{dateTime(item.createdAt)}</time></article>)}</div>
        <form onSubmit={sendReply} className="border-t border-slate-200 p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><label htmlFor="support-reply" className="font-semibold">Reply securely</label><span className="text-xs text-slate-400">{reply.length} / 2000</span></div><textarea id="support-reply" value={reply} onChange={(event) => setReply(event.target.value.slice(0, 2000))} rows="4" className="field-control mt-3" placeholder="Add information or answer our support team" aria-describedby="reply-note"/><div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p id="reply-note" className="flex items-center gap-2 text-xs leading-5 text-slate-500"><FiClock aria-hidden="true"/>Replies normally arrive within 1–2 business days.</p><button disabled={sending || reply.trim().length < 2} className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"><FiSend aria-hidden="true"/>{sending ? "Sending…" : activeTicket.status === "resolved" ? "Reopen and send" : "Send reply"}</button></div></form>
      </section>}
    </div>}
  </div></main>;
}
