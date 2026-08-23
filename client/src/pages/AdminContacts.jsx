import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiChevronDown, FiMail, FiMessageSquare, FiSearch, FiSend, FiUser } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

const topicLabels = { general: "General", order: "Order", delivery: "Delivery", return: "Return / refund", payment: "Payment" };
const statusLabels = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
const statusStyles = { open: "bg-amber-50 text-amber-800", in_progress: "bg-blue-50 text-blue-800", resolved: "bg-emerald-50 text-emerald-800" };
const normalizeContact = (contact) => ({ ...contact, topic: contact.topic || "general", status: contact.status || "open", replies: Array.isArray(contact.replies) ? contact.replies : [], reference: String(contact._id || "").slice(-8).toUpperCase() });

function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`).then(({ data }) => { if (active) setContacts(Array.isArray(data) ? data : []); }).catch(() => { if (active) setError("Customer messages could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.map(normalizeContact).filter((contact) => (topic === "all" || contact.topic === topic) && (status === "all" || contact.status === status) && (!query || `${contact.reference} ${contact.name} ${contact.email} ${contact.orderReference || ""} ${contact.message} ${contact.replies.map((reply) => reply.body).join(" ")}`.toLowerCase().includes(query)));
  }, [contacts, search, status, topic]);
  const openCount = contacts.filter((contact) => (contact.status || "open") !== "resolved").length;
  const unreadCount = contacts.filter((contact) => !contact.readAt).length;

  const openMessage = async (contact) => {
    setExpanded((current) => current === contact._id ? null : contact._id);
    if (contact.readAt) return;
    try {
      const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/contacts/${contact._id}/read`);
      setContacts((current) => current.map((item) => item._id === contact._id ? data : item));
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    } catch { toast.error("Message could not be marked as read"); }
  };

  const updateStatus = async (id, nextStatus) => {
    try {
      const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/contacts/${id}/status`, { status: nextStatus });
      setContacts((current) => current.map((item) => item._id === id ? data : item));
      window.dispatchEvent(new Event("admin-notifications-refresh"));
      toast.success(`Support request marked ${statusLabels[nextStatus].toLowerCase()}`);
    } catch (requestError) { toast.error(requestError.response?.data?.message || "Support status could not be updated"); }
  };

  const sendReply = async (contact) => {
    const message = String(drafts[contact._id] || "").trim();
    if (message.length < 2) return toast.error("Write a reply before sending");
    setSendingReply(contact._id);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/contacts/${contact._id}/replies`, { message });
      setContacts((current) => current.map((item) => item._id === contact._id ? data : item));
      setDrafts((current) => ({ ...current, [contact._id]: "" }));
      window.dispatchEvent(new Event("admin-notifications-refresh"));
      toast.success(contact.customerId ? "Reply sent to the customer portal and email" : "Reply sent by email");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Support reply could not be sent");
    } finally {
      setSendingReply(null);
    }
  };

  return <SellerPage><SellerHeader title="Customer support" description="Review, prioritise and resolve requests submitted from the storefront."/>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Open requests</p><p className="mt-2 text-3xl font-bold">{openCount}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Unread</p><p className="mt-2 text-3xl font-bold">{unreadCount}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">All requests</p><p className="mt-2 text-3xl font-bold">{contacts.length}</p></div></section>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_190px_190px] md:p-5"><label className="relative"><span className="sr-only">Search support requests</span><FiSearch aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search name, email, order or reference" className="field-control pl-11"/></label><label><span className="sr-only">Filter by topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)} className="field-control"><option value="all">All topics</option>{Object.entries(topicLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Support inbox</h2><p role="status" className="mt-1 text-sm text-slate-500">{loading ? "Loading requests…" : `${visibleContacts.length} request${visibleContacts.length === 1 ? "" : "s"}`}</p></div>
      {error && <div role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && visibleContacts.length === 0 ? <SellerEmpty title="No matching requests" description="Adjust the search or filters to see other customer messages."/> : <div className="divide-y divide-slate-100">{visibleContacts.map((contact) => { const isExpanded = expanded === contact._id; return <article key={contact._id} className={contact.readAt ? "bg-white" : "bg-amber-50/35"}>
        <button type="button" onClick={() => openMessage(contact)} aria-expanded={isExpanded} aria-controls={`support-${contact._id}`} className="grid w-full gap-3 px-5 py-5 text-left md:grid-cols-[150px_1fr_170px_40px] md:items-center md:px-6"><div><p className="font-mono text-xs font-bold text-brand-primary">#{contact.reference}</p><p className="mt-1 text-xs text-slate-400">{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString("en-IN") : "—"}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-slate-900">{contact.name}</p>{!contact.readAt && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">New</span>}</div><p className="mt-1 truncate text-sm text-slate-500">{contact.message}</p></div><div className="flex flex-wrap gap-2 md:justify-end"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{topicLabels[contact.topic]}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[contact.status]}`}>{statusLabels[contact.status]}</span></div><FiChevronDown aria-hidden="true" className={`justify-self-end transition ${isExpanded ? "rotate-180" : ""}`}/></button>
        {isExpanded && <div id={`support-${contact._id}`} className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 md:px-6"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"><div className="min-w-0"><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</dt><dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold">{contact.name}<span className={`rounded-full px-2 py-0.5 text-[11px] ${contact.customerId ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{contact.customerId ? "Account ticket" : "Email-only guest"}</span></dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</dt><dd className="mt-1 break-all"><a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Tamanna's Hut support ${contact.reference}`)}`} className="inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"><FiMail aria-hidden="true"/>{contact.email}</a></dd></div>{contact.orderReference && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order reference</dt><dd className="mt-1 font-mono font-semibold">{contact.orderReference}</dd></div>}<div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last activity</dt><dd className="mt-1">{contact.lastActivityAt || contact.createdAt ? new Date(contact.lastActivityAt || contact.createdAt).toLocaleString("en-IN") : "—"}</dd></div></dl>
          <section aria-label={`Conversation ${contact.reference}`} className="mt-5 rounded-2xl border bg-white p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-semibold"><FiMessageSquare aria-hidden="true"/>Conversation</div><div className="mt-4 space-y-3"><div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-100 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{contact.message}</p><p className="mt-2 text-[11px] text-slate-400">Customer · {contact.createdAt ? new Date(contact.createdAt).toLocaleString("en-IN") : ""}</p></div>{contact.replies.map((reply, index) => <div key={reply._id || `${reply.sender}-${index}`} className={`flex ${reply.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl p-4 ${reply.sender === "admin" ? "rounded-tr-sm bg-brand-primary text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}><p className="whitespace-pre-wrap text-sm leading-6">{reply.body}</p><p className={`mt-2 text-[11px] ${reply.sender === "admin" ? "text-white/65" : "text-slate-400"}`}>{reply.sender === "admin" ? "Support team" : "Customer"} · {reply.createdAt ? new Date(reply.createdAt).toLocaleString("en-IN") : ""}</p></div></div>)}</div>
          <label className="mt-5 block text-sm font-semibold">Reply to customer<textarea value={drafts[contact._id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [contact._id]: event.target.value }))} rows="4" maxLength="2000" placeholder={contact.customerId ? "Write a secure portal reply…" : "Write an email reply…"} className="field-control mt-2 resize-y"/></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-500">{contact.customerId ? "The reply appears in the customer portal and is also emailed." : "Guest requests are replied to by email only."}</p><button type="button" onClick={() => sendReply(contact)} disabled={sendingReply === contact._id} className="btn-primary min-h-11"><FiSend aria-hidden="true"/>{sendingReply === contact._id ? "Sending…" : "Send reply"}</button></div></section></div>
          <div className="space-y-4"><label className="block text-sm font-semibold">Request status<select value={contact.status} onChange={(event) => updateStatus(contact._id, event.target.value)} className="field-control mt-2"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Update this as the request is handled.</span></label><div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><div className="flex items-center gap-2 font-semibold text-slate-900"><FiUser aria-hidden="true"/>Reply delivery</div><p className="mt-2 leading-6">{contact.customerId ? "Visible after sign-in and copied to the account email." : "This guest did not sign in, so no portal history is available."}</p></div></div></div></div>}
      </article>; })}</div>}
    </section>
  </SellerPage>;
}

export default AdminContacts;
