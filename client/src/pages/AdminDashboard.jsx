import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight, FiBox, FiRefreshCw, FiShoppingBag, FiTrendingDown, FiTrendingUp, FiUsers } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const changeTone = (value) => Number(value) >= 0 ? "text-emerald-700" : "text-red-600";

function Change({ value, label }) {
  const Icon = Number(value) >= 0 ? FiTrendingUp : FiTrendingDown;
  return <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${changeTone(value)}`}><Icon/> {Math.abs(Number(value || 0)).toFixed(1)}% {Number(value) >= 0 ? "up" : "down"} {label}</p>;
}

function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/analytics`, { params: { days } })
      .then(({ data: response }) => { if (active) setData(response); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days, reloadKey]);

  const summary = data?.summary || {};
  const maxRevenue = useMemo(() => Math.max(...(data?.dailySales || []).map((item) => Number(item.revenue || 0)), 1), [data]);
  const cards = [
    ["Realized revenue", currency(summary.realizedRevenue), FiTrendingUp, <Change value={summary.revenueChange} label="vs previous period"/>],
    ["Orders placed", Number(summary.orders || 0).toLocaleString("en-IN"), FiShoppingBag, <Change value={summary.orderChange} label="vs previous period"/>],
    ["Average order value", currency(summary.averageOrderValue), FiBox, <p className="mt-2 text-xs text-slate-400">Based on delivered orders</p>],
    ["Repeat customers", `${Number(summary.repeatCustomerRate || 0).toFixed(1)}%`, FiUsers, <p className="mt-2 text-xs text-slate-400">Customers ordering more than once</p>],
  ];

  return <SellerPage>
    <SellerHeader title="Overview" description="Sales, fulfilment and catalogue signals calculated from your store orders." action={<div className="flex gap-2"><select aria-label="Analytics period" value={days} onChange={(event) => { setLoading(true); setDays(Number(event.target.value)); }} className="field-control min-w-32 bg-white"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><button type="button" aria-label="Refresh analytics" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="btn-secondary px-4"><FiRefreshCw/></button></div>} />

    {!loading && !data ? <SellerEmpty title="Analytics are temporarily unavailable" description="Refresh the page while the store reconnects to reporting data."/> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f0] text-[#28583d]"><Icon/></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : value}</p>{!loading && detail}</article>)}</div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Daily realized sales</h2><p className="mt-1 text-sm text-slate-500">Revenue from orders that are currently delivered.</p></div><p className="text-sm font-semibold text-brand-primary">{currency(summary.realizedRevenue)}</p></div><div className="mt-8 flex h-56 items-end gap-1.5 border-b border-slate-200 px-1" aria-label="Daily revenue chart">{(data?.dailySales || []).map((item, index) => <div key={item.date} className="group relative flex h-full min-w-0 flex-1 items-end"><div style={{ height: `${Math.max((Number(item.revenue || 0) / maxRevenue) * 100, item.revenue ? 5 : 1)}%` }} className="w-full rounded-t bg-[#397153] transition hover:bg-[#1f4b34]"/><span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs text-white group-hover:block">{new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: {currency(item.revenue)} · {item.orders} orders</span>{(data.dailySales.length <= 14 || index % Math.ceil(data.dailySales.length / 8) === 0) && <span className="absolute top-full mt-2 text-[10px] text-slate-400">{new Date(item.date).getDate()}</span>}</div>)}</div></section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Store health</h2><div className="mt-5 divide-y">{[["Published products", summary.publishedProducts, FiBox],["Low-stock products", summary.lowStockProducts, FiAlertTriangle],["Active customer carts", summary.activeCustomerCarts, FiShoppingBag],["Registered customers", summary.registeredCustomers, FiUsers]].map(([label,value,Icon]) => <div key={label} className="flex items-center justify-between py-4 first:pt-0"><div className="flex items-center gap-3 text-sm text-slate-600"><Icon className="text-brand-primary"/>{label}</div><strong>{loading ? "—" : Number(value || 0).toLocaleString("en-IN")}</strong></div>)}</div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Active carts are saved customer carts, not confirmed abandoned checkouts.</p></section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Order status</h2><div className="mt-5 space-y-3">{(data?.statusBreakdown || []).map((item) => <div key={item.status} className="flex items-center justify-between gap-3"><StatusBadge value={item.status}/><strong>{item.count}</strong></div>)}</div></section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Top products</h2>{data?.topProducts?.length ? <div className="mt-5 space-y-4">{data.topProducts.slice(0,5).map((item,index) => <div key={item.productId} className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-xs text-slate-500">{item.units} units</p></div><strong className="text-sm">{currency(item.revenue)}</strong></div>)}</div> : <p className="mt-5 text-sm text-slate-500">Delivered product sales will appear here.</p>}</section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Payments and refunds</h2><div className="mt-5 space-y-3">{(data?.paymentMix || []).map((item) => <div key={item.method} className="flex justify-between text-sm"><span className="text-slate-500">{item.method}</span><strong>{item.count} orders</strong></div>)}</div><div className="mt-5 border-t pt-4"><div className="flex justify-between text-sm"><span className="text-slate-500">Processed refunds</span><strong>{summary.refunds || 0}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Refunded amount</span><strong>{currency(summary.refundedAmount)}</strong></div></div></section>
      </div>

      {data?.couponPerformance?.length > 0 && <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-5 md:px-6"><h2 className="text-lg font-semibold">Coupon performance</h2><p className="mt-1 text-sm text-slate-500">Usage and discounts across orders placed in this period.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Orders</th><th className="px-6 py-3">Discount</th><th className="px-6 py-3 text-right">Order value</th></tr></thead><tbody className="divide-y">{data.couponPerformance.map((item) => <tr key={item.code}><td className="px-6 py-4 font-mono font-semibold">{item.code}</td><td className="px-6 py-4">{item.orders}</td><td className="px-6 py-4">{currency(item.discount)}</td><td className="px-6 py-4 text-right font-semibold">{currency(item.revenue)}</td></tr>)}</tbody></table></div></section>}

      <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b px-5 py-5 md:px-6"><div><h2 className="text-lg font-semibold">Recent orders</h2><p className="mt-1 text-sm text-slate-500">Latest orders from the selected period.</p></div><Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">View all <FiArrowRight/></Link></div>{!loading && !data?.recentOrders?.length ? <SellerEmpty title="No orders in this period" description="Choose a longer date range or wait for new orders."/> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th></tr></thead><tbody className="divide-y">{(data?.recentOrders || []).map((order) => <tr key={order._id} className="hover:bg-slate-50/70"><td className="px-6 py-4 font-mono text-xs">#{String(order._id).slice(-8).toUpperCase()}</td><td className="px-6 py-4"><p className="font-medium">{order.customerName || "Customer"}</p><p className="text-xs text-slate-500">{order.city || "—"}</p></td><td className="px-6 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td className="px-6 py-4"><StatusBadge value={order.status}/></td><td className="px-6 py-4 text-right font-semibold">{currency(order.totalAmount)}</td></tr>)}</tbody></table></div>}</section>
    </>}
  </SellerPage>;
}

export default AdminDashboard;
