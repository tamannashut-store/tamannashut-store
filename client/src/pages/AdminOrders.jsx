import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiDownload, FiMail, FiSearch } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const statuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [tracking, setTracking] = useState({});
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`); const list = data.orders || data.data || data; setOrders(Array.isArray(list) ? list : []); }
    catch { toast.error("Could not load orders"); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders`)
      .then(({ data }) => { if (active) { const list = data.orders || data.data || data; setOrders(Array.isArray(list) ? list : []); } })
      .catch(() => { if (active) toast.error("Could not load orders"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [order._id, order.customerName, order.phone, order.email].some((value) => String(value || "").toLowerCase().includes(term));
    return matchesSearch && (status === "All" || order.status === status);
  }), [orders, search, status]);

  const updateOrder = async (id, values, successMessage) => {
    try { await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, values); toast.success(successMessage); loadOrders(); }
    catch (error) { toast.error(error.response?.data?.message || "Order could not be updated"); }
  };
  const invoice = async (id, resend = false) => {
    try {
      if (resend) { await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/resend-invoice/${id}`, {}); toast.success("Invoice sent"); return; }
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/invoice/${id}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data); window.open(url, "_blank", "noopener,noreferrer"); setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast.error("Invoice action failed"); }
  };

  return <SellerPage>
    <SellerHeader title="Orders" description="Review purchases, update fulfilment and keep customers informed." />
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
      <label className="relative flex-1"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field-control pl-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, phone or email" /></label>
      <select className="field-control md:w-52" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold">All orders</h2><p className="mt-1 text-sm text-slate-500">{loading ? "Loading…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}</p></div>
      {!loading && filtered.length === 0 ? <SellerEmpty title="No matching orders" description="Try changing the search or status filter." /> : <div className="divide-y divide-slate-100">{filtered.map((order) => {
        const id = String(order._id); const isOpen = expanded === id;
        return <article key={id}>
          <button type="button" onClick={() => setExpanded(isOpen ? null : id)} className="grid w-full gap-4 px-6 py-5 text-left hover:bg-slate-50 md:grid-cols-[1fr_1.2fr_0.8fr_0.7fr_0.7fr] md:items-center">
            <div><p className="font-mono text-xs font-semibold text-slate-700">#{id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</p></div>
            <div><p className="font-semibold text-slate-900">{order.customerName || "Customer"}</p>{order.phone ? <a href={`tel:${String(order.phone).replace(/\s/g, "")}`} onClick={(event) => event.stopPropagation()} className="mt-1 block text-xs text-[#397153] hover:underline">{order.phone}</a> : <p className="mt-1 text-xs text-slate-500">{order.email}</p>}</div>
            <StatusBadge value={order.status} /><p className="text-sm capitalize text-slate-500">{order.paymentMethod || "—"}</p><p className="font-bold text-slate-900 md:text-right">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
          </button>
          {isOpen && <div className="border-t border-slate-100 bg-slate-50/70 p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Items</h3><div className="mt-3 space-y-3">{(order.products || []).map((item, index) => <div key={`${item._id}-${item.selectedSize}-${index}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"><div className="h-16 w-14 overflow-hidden rounded-lg bg-slate-100">{item.image && <img src={item.image.startsWith("http") ? item.image : `${import.meta.env.VITE_API_URL}${item.image}`} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="mt-1 text-xs text-slate-500">Size {item.selectedSize} · Qty {item.qty}</p></div><p className="font-semibold">₹{Number(item.price * item.qty).toLocaleString("en-IN")}</p></div>)}</div><div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-900">Delivery address</p><p className="mt-1">{order.address}</p><p>{order.city} {order.pincode}</p><p>{order.email}</p></div></div>
              <aside className="space-y-4"><label className="field-label">Order status<select className="field-control mt-2" value={order.status} onChange={(e) => updateOrder(id, { status: e.target.value }, "Order status updated")}>{statuses.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Tracking number<input className="field-control mt-2" value={tracking[id] ?? order.tracking?.trackingId ?? ""} onChange={(e) => setTracking((current) => ({ ...current, [id]: e.target.value }))} placeholder="Courier tracking ID" /></label><button type="button" onClick={() => updateOrder(id, { trackingNumber: { trackingId: tracking[id] ?? order.tracking?.trackingId ?? "" } }, "Tracking updated")} className="btn-secondary w-full">Save tracking</button><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => invoice(id)} className="btn-secondary"><FiDownload /> Invoice</button><button type="button" onClick={() => invoice(id, true)} className="btn-secondary"><FiMail /> Send</button></div></aside>
            </div>
          </div>}
        </article>;
      })}</div>}
    </section>
  </SellerPage>;
}
export default AdminOrders;
