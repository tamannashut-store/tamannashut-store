import { useEffect, useState } from "react";
import axios from "axios";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const api = `${import.meta.env.VITE_API_URL}/api/ads`;
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function AdminAds() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const load = () => axios.get(`${api}/admin`)
    .then(({ data }) => setCampaigns(data.campaigns || []))
    .catch((requestError) => setError(requestError.response?.data?.message || "Ad campaigns could not be loaded"));
  useEffect(() => { load(); }, []);
  const review = async (campaign, decision) => {
    try {
      setError("");
      await axios.patch(`${api}/admin/${campaign._id}/review`, { decision, note: notes[campaign._id] || "" });
      await load();
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Campaign could not be updated");
    }
  };
  return <SellerPage>
    <SellerHeader eyebrow="Marketplace monetisation" title="Seller ads" description="Review paid campaigns, protect catalogue quality and keep all sponsored placements transparent."/>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    <div className="space-y-4">
      {!campaigns.length ? <SellerEmpty title="No seller campaigns" description="Paid promotion requests will appear here."/> : campaigns.map((campaign) => <article key={campaign._id} className="grid gap-5 rounded-2xl border bg-white p-5 shadow-sm xl:grid-cols-[1fr_220px_330px]">
        <div className="flex gap-4">
          <img src={campaign.productId?.images?.[0]?.url} alt="" className="h-24 w-20 rounded-xl object-cover"/>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{campaign.productId?.name || "Listing unavailable"}</h2><StatusBadge value={campaign.status}/></div>
            <p className="mt-2 text-sm text-slate-500">Seller: {campaign.sellerId?.name} · {campaign.sellerId?.email}</p>
            <p className="mt-1 text-sm capitalize">{campaign.placement} · {campaign.durationDays} days · <strong>{money(campaign.amount)}</strong></p>
            {campaign.reviewNote && <p className="mt-2 text-sm text-amber-700">Note: {campaign.reviewNote}</p>}
            {["submitted", "processed"].includes(campaign.refundStatus) && <p className="mt-2 break-all text-xs font-semibold text-violet-700">Full Razorpay refund {campaign.refundStatus} · {campaign.refundId}</p>}
            {campaign.refundStatus === "failed" && <p className="mt-2 text-xs font-semibold text-red-700">Razorpay reported a failed refund. Manual admin action is required.</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><span>Impressions<strong className="block text-lg">{campaign.impressions || 0}</strong></span><span>Clicks<strong className="block text-lg">{campaign.clicks || 0}</strong></span><span>CTR<strong className="block">{campaign.ctr || 0}%</strong></span><span>Paid<strong className="block">{campaign.paidAt ? "Yes" : "No"}</strong></span></div>
        <div>
          <textarea rows="2" value={notes[campaign._id] ?? campaign.reviewNote ?? ""} onChange={(event) => setNotes({ ...notes, [campaign._id]: event.target.value })} placeholder="Review note (required when rejecting)" className="field-control"/>
          {campaign.status === "pending_review" && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => review(campaign, "approved")} className="btn-primary">Approve</button><button onClick={() => review(campaign, "rejected")} className="btn-secondary border-red-200 text-red-700">Reject &amp; refund</button></div>}
          {campaign.status === "active" && <button onClick={() => review(campaign, "paused")} className="btn-secondary mt-3 w-full">Pause campaign</button>}
          {campaign.status === "paused" && <button onClick={() => review(campaign, "active")} className="btn-primary mt-3 w-full">Resume campaign</button>}
        </div>
      </article>)}
    </div>
  </SellerPage>;
}
