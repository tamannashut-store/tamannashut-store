import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiBox, FiCheckCircle, FiClock, FiShoppingBag } from "react-icons/fi";
import { SellerHeader, SellerPage } from "../components/SellerUI";

function SellerDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/seller`).then(({ data }) => { if (active) setSummary(data.summary); }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Seller dashboard could not be loaded"); }); return () => { active = false; }; }, []);
  const cards = [
    ["My listings", summary?.products, FiBox],
    ["Active listings", summary?.activeProducts, FiCheckCircle],
    ["Pending approval", summary?.pendingListings, FiClock],
    ["Orders containing my products", summary?.orders, FiShoppingBag],
  ];
  return <SellerPage><SellerHeader eyebrow="My business" title="Seller overview" description="Only your own catalogue and order lines appear in this workspace." action={<Link to="/seller/products" className="btn-primary">Manage my listings</Link>}/>
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon]) => <article key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-brand-primary"><Icon/></span><p className="mt-5 text-sm text-slate-500">{label}</p><strong className="mt-1 block text-3xl">{value ?? "—"}</strong></article>)}</section>
    <section className="mt-6 grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">Delivered product revenue</h2><p className="mt-2 text-sm text-slate-500">Gross line value before marketplace fees, taxes, refunds and settlement adjustments.</p><strong className="mt-5 block text-3xl text-brand-primary">₹{Number(summary?.deliveredRevenue || 0).toLocaleString("en-IN")}</strong></article><article className="rounded-2xl border bg-amber-50 p-6"><div className="flex gap-3"><FiAlertTriangle className="mt-1 shrink-0 text-amber-700"/><div><h2 className="font-bold text-amber-950">{summary?.lowStockProducts || 0} low-stock listings</h2><p className="mt-2 text-sm leading-6 text-amber-900">Review colour and size inventory. Every seller action is restricted to products owned by this account.</p></div></div></article></section>
  </SellerPage>;
}

export default SellerDashboard;
