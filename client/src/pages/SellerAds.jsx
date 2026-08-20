import { useEffect, useState } from "react";
import axios from "axios";
import { FiBarChart2, FiPause, FiPlay, FiPlus } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const api = `${import.meta.env.VITE_API_URL}/api/ads`;
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existing) { existing.addEventListener("load", resolve, { once: true }); existing.addEventListener("error", reject, { once: true }); return; }
  const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = resolve; script.onerror = reject; document.body.appendChild(script);
});
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function SellerAds() {
  const [data, setData] = useState({ campaigns: [], products: [] });
  const [config, setConfig] = useState({ packages: [], placements: [] });
  const [draft, setDraft] = useState({ productId: "", placement: "home", packageKey: "starter" });
  const [creating, setCreating] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = () => Promise.all([axios.get(`${api}/seller`), axios.get(`${api}/packages`)]).then(([campaigns, packages]) => { setData(campaigns.data); setConfig(packages.data); setDraft((current) => ({ ...current, productId: current.productId || campaigns.data.products?.[0]?._id || "" })); }).catch((requestError) => setError(requestError.response?.data?.message || "Campaigns could not be loaded"));
  useEffect(() => { load(); }, []);
  const createCampaign = async () => {
    setError(""); setMessage(""); setCreating(true);
    try {
      if (!draft.productId) throw new Error("Choose an approved listing first");
      await loadRazorpay();
      const { data: started } = await axios.post(`${api}/seller/create-order`, draft);
      const sessionUser = JSON.parse(localStorage.getItem("user") || "{}").user || {};
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY, amount: started.order.amount, currency: started.order.currency,
        name: "Tamanna's Hut", description: "Seller listing promotion", order_id: started.order.id,
        prefill: { name: sessionUser.name, email: sessionUser.email },
        theme: { color: "#183d2b" },
        modal: { ondismiss: () => axios.patch(`${api}/seller/${started.campaignId}/status`, { status: "cancelled" }).then(load).catch(() => {}) },
        handler: async (response) => { await axios.post(`${api}/seller/verify`, { campaignId: started.campaignId, ...response }); setMessage("Payment verified. The platform administrator will review your campaign."); await load(); },
      });
      razorpay.on("payment.failed", (event) => { setError(event.error?.description || "Payment failed"); axios.patch(`${api}/seller/${started.campaignId}/status`, { status: "cancelled" }).then(load).catch(() => {}); }); razorpay.open();
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || "Campaign could not be created"); }
      finally { setCreating(false); }
  };
  const changeStatus = async (campaign, status) => { try { await axios.patch(`${api}/seller/${campaign._id}/status`, { status }); await load(); } catch (requestError) { setError(requestError.response?.data?.message || "Campaign could not be updated"); } };
  return <SellerPage><SellerHeader eyebrow="Paid growth" title="Listing ads" description="Promote only your approved listings. Every sponsored placement is labelled, payment-verified and reviewed by the platform."/>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
    <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-brand-primary"><FiPlus/></span><div><h2 className="text-lg font-bold">Create a sponsored campaign</h2><p className="text-sm text-slate-500">Charges are fixed for the selected duration. Approval starts the campaign clock.</p></div></div>
      {data.products.length ? <div className="mt-5 grid gap-4 lg:grid-cols-4"><label className="text-sm font-medium lg:col-span-2">Listing<select className="field-control mt-2" value={draft.productId} onChange={(event) => setDraft({ ...draft, productId: event.target.value })}>{data.products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label><label className="text-sm font-medium">Placement<select className="field-control mt-2" value={draft.placement} onChange={(event) => setDraft({ ...draft, placement: event.target.value })}>{config.placements.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label className="text-sm font-medium">Package<select className="field-control mt-2" value={draft.packageKey} onChange={(event) => setDraft({ ...draft, packageKey: event.target.value })}>{config.packages.map((item) => <option key={item.key} value={item.key}>{item.label} · {item.days} days · {money(item.amount)}</option>)}</select></label><button type="button" disabled={creating} onClick={createCampaign} className="btn-primary lg:col-start-4">{creating ? "Starting…" : "Pay & submit for review"}</button></div> : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">You need an approved, active listing before you can advertise.</p>}
    </section>
    <section className="mt-7"><h2 className="text-xl font-bold">Your campaigns</h2><div className="mt-4 space-y-4">{!data.campaigns.length ? <SellerEmpty title="No campaigns yet" description="Your paid listing promotions will appear here."/> : data.campaigns.map((campaign) => <article key={campaign._id} className="grid gap-5 rounded-2xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]"><div className="flex gap-4"><img src={campaign.productId?.images?.[0]?.url} alt="" className="h-20 w-16 rounded-lg object-cover"/><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{campaign.productId?.name || "Listing unavailable"}</h3><StatusBadge value={campaign.status}/></div><p className="mt-1 text-sm capitalize text-slate-500">{campaign.placement} · {campaign.durationDays} days · {money(campaign.amount)}</p>{campaign.reviewNote && <p className="mt-2 text-sm text-amber-700">Platform note: {campaign.reviewNote}</p>}</div></div><div className="flex items-center gap-5"><div><p className="text-xs text-slate-500">Impressions</p><strong>{campaign.impressions || 0}</strong></div><div><p className="text-xs text-slate-500">Clicks / CTR</p><strong>{campaign.clicks || 0} / {campaign.ctr || 0}%</strong></div>{campaign.status === "active" && <button type="button" onClick={() => changeStatus(campaign, "paused")} className="btn-secondary"><FiPause/> Pause</button>}{campaign.status === "paused" && <button type="button" onClick={() => changeStatus(campaign, "active")} className="btn-secondary"><FiPlay/> Resume</button>}</div></article>)}</div></section>
    <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500"><FiBarChart2 className="mt-0.5 shrink-0"/>Impressions and clicks are directional storefront metrics, not guaranteed sales. If the platform rejects a paid campaign, the full payment is automatically submitted to Razorpay for refund.</p>
  </SellerPage>;
}
