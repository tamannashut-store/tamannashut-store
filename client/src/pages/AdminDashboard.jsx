import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBox, FiShoppingBag, FiTrendingUp, FiAlertTriangle } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, { params: { limit: 100 } }),
      axios.get(`${import.meta.env.VITE_API_URL}/api/orders`),
    ]).then(([productResponse, orderResponse]) => {
      if (!active) return;
      setProducts(productResponse.data.products || []);
      const data = orderResponse.data.orders || orderResponse.data.data || orderResponse.data;
      setOrders(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const revenue = orders.filter((order) => !["cancelled", "refunded", "rto delivered"].includes(String(order.status).toLowerCase())).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const lowStock = products.filter((product) => (product.variants?.length ? product.variants : product.sizeStock || []).some((item) => Number(item.stock) <= Number(product.lowStockThreshold ?? 3))).length;
    return { revenue, lowStock, openOrders: orders.filter((order) => !["delivered", "cancelled", "refunded", "rto delivered"].includes(String(order.status).toLowerCase())).length };
  }, [orders, products]);

  const cards = [
    ["Published products", products.filter((product) => product.status !== "archived" && product.status !== "draft").length, FiBox, "Catalogue items customers can see"],
    ["Open orders", metrics.openOrders, FiShoppingBag, "Orders requiring fulfilment"],
    ["Revenue", `₹${metrics.revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, FiTrendingUp, "Excludes cancelled orders"],
    ["Low stock", metrics.lowStock, FiAlertTriangle, "Listings at or below threshold"],
  ];

  return (
    <SellerPage>
      <SellerHeader title="Overview" description="A clear view of catalogue health, fulfilment and recent sales activity." action={<Link to="/admin" className="btn-primary">Manage products <FiArrowRight /></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, copy]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f0] text-[#28583d]"><Icon /></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : value}</p><p className="mt-2 text-xs text-slate-400">{copy}</p></article>)}
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="text-lg font-semibold">Recent orders</h2><p className="mt-1 text-sm text-slate-500">Latest customer purchases and fulfilment status.</p></div><Link to="/admin/orders" className="text-sm font-semibold text-[#28583d]">View all</Link></div>
        {!loading && orders.length === 0 ? <SellerEmpty title="No orders yet" description="New orders will appear here automatically." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.slice(0, 8).map((order) => <tr key={order._id} className="hover:bg-slate-50/70"><td className="px-6 py-4 font-mono text-xs text-slate-600">#{String(order._id).slice(-8).toUpperCase()}</td><td className="px-6 py-4"><p className="font-medium text-slate-900">{order.customerName || "Customer"}</p><p className="text-xs text-slate-500">{order.city || order.email}</p></td><td className="px-6 py-4 text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</td><td className="px-6 py-4"><StatusBadge value={order.status} /></td><td className="px-6 py-4 text-right font-semibold">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </SellerPage>
  );
}

export default AdminDashboard;
