import { useEffect, useState } from "react";
import axios from "axios";
import { FiMail } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`).then(async ({ data }) => { const items = Array.isArray(data) ? data : []; if (active) setContacts(items); const unreadIds = items.filter((item) => !item.readAt).map((item) => item._id); if (unreadIds.length) { await axios.patch(`${import.meta.env.VITE_API_URL}/api/contacts/read`, { ids: unreadIds }); if (active) { setContacts((current) => current.map((item) => unreadIds.includes(item._id) ? { ...item, readAt: new Date().toISOString() } : item)); window.dispatchEvent(new Event("admin-notifications-refresh")); } } }).catch(() => {}).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <SellerPage><SellerHeader title="Customer messages" description="Questions and requests submitted through the storefront contact form." />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold">Inbox</h2><p className="mt-1 text-sm text-slate-500">{loading ? "Loading messages…" : `${contacts.length} message${contacts.length === 1 ? "" : "s"}`}</p></div>
      {!loading && contacts.length === 0 ? <SellerEmpty title="Inbox is clear" description="New customer messages will appear here." /> : <div className="divide-y divide-slate-100">{contacts.map((contact) => <article key={contact._id} className="grid gap-4 px-6 py-5 md:grid-cols-[220px_1fr_150px]"><div><p className="font-semibold text-slate-900">{contact.name}</p><a href={`mailto:${contact.email}`} className="mt-1 flex items-center gap-2 text-sm text-[#397153]"><FiMail />{contact.email}</a></div><p className="text-sm leading-6 text-slate-600">{contact.message}</p><time className="text-xs text-slate-400 md:text-right">{contact.createdAt ? new Date(contact.createdAt).toLocaleString("en-IN") : "—"}</time></article>)}</div>}
    </section>
  </SellerPage>;
}
export default AdminContacts;
