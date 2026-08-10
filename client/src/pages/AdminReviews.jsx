import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCheck, FiRefreshCw, FiStar, FiX } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const filters = ["pending", "approved", "rejected", "all"];

function AdminReviews() {
  const [status, setStatus] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/reviews/list`, { params: { status } });
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/reviews/list`, { params: { status } })
      .then(({ data }) => { if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []); })
      .catch((error) => { if (active) toast.error(error.response?.data?.message || "Could not load reviews"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);

  const moderate = async (review, nextStatus) => {
    const action = nextStatus === "approved" ? "publish" : "reject";
    if (!window.confirm(`${action === "publish" ? "Publish" : "Reject"} this customer review?`)) return;
    setUpdating(review._id);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/products/admin/${review.productId}/reviews/${review._id}`, { status: nextStatus });
      toast.success(nextStatus === "approved" ? "Review published" : "Review rejected");
      await loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Review could not be updated");
    } finally {
      setUpdating("");
    }
  };

  return <SellerPage>
    <SellerHeader title="Customer reviews" description="Moderate verified-purchase reviews before they appear on product pages." action={<button type="button" onClick={() => { setLoading(true); loadReviews(); }} className="btn-secondary"><FiRefreshCw/> Refresh</button>} />
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Review status">
      {filters.map((filter) => <button key={filter} type="button" role="tab" aria-selected={status === filter} onClick={() => { setLoading(true); setStatus(filter); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize ${status === filter ? "bg-brand-primary text-white" : "border bg-white text-slate-600"}`}>{filter}</button>)}
    </div>
    {loading ? <div className="surface-card px-6 py-16 text-center text-slate-500">Loading reviews…</div> : !reviews.length ? <SellerEmpty title={`No ${status === "all" ? "" : status} reviews`} description="New verified customer reviews will appear here." /> : <div className="grid gap-5 xl:grid-cols-2">
      {reviews.map((review) => <article key={`${review.productId}-${review._id}`} className="surface-card p-5 md:p-6">
        <div className="flex items-start gap-4">
          {review.productImage ? <img src={review.productImage} alt="" className="h-20 w-16 shrink-0 rounded-xl border object-cover"/> : <div className="h-20 w-16 shrink-0 rounded-xl bg-slate-100"/>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{review.productName}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"><FiStar/> {review.rating}/5</span><StatusBadge value={review.status}/>{review.verifiedPurchase && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Verified purchase</span>}</div></div>
        </div>
        <div className="mt-5 border-t pt-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{review.name || "Customer"}</p><time className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString("en-IN")}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.comment}</p></div>
        {review.status === "pending" && <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={updating === review._id} onClick={() => moderate(review, "rejected")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 disabled:opacity-50"><FiX/> Reject</button><button type="button" disabled={updating === review._id} onClick={() => moderate(review, "approved")} className="btn-primary disabled:opacity-50"><FiCheck/> Approve</button></div>}
      </article>)}
    </div>}
  </SellerPage>;
}

export default AdminReviews;
