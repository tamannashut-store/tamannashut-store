import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCheck, FiExternalLink, FiX } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

function AdminSellerListings() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reviewing, setReviewing] = useState({});
  const pendingReviews = useRef(new Set());
  const load = useCallback(async () => { setLoading(true); setLoadError(false); try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, { params: { approval: "pending", limit: 100 } }); setProducts(data.products || []); } catch { setLoadError(true); } finally { setLoading(false); } }, []);
  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, { params: { approval: "pending", limit: 100 } })
      .then(({ data }) => { if (active) setProducts(data.products || []); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const review = async (product, approvalStatus) => {
    if (pendingReviews.current.has(product._id) || loading || loadError) return;
    const approvalNote = approvalStatus === "rejected" ? window.prompt("Explain what the seller must correct:", "") : "";
    if (approvalStatus === "rejected" && (approvalNote === null || approvalNote.trim().length < 5)) return;
    if (!window.confirm(`${approvalStatus === "approved" ? "Approve and publish" : "Return"} ${product.name}?`)) return;
    pendingReviews.current.add(product._id);
    setReviewing((current) => ({ ...current, [product._id]: true }));
    try { const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/products/admin/${product._id}/approval`, { approvalStatus, approvalNote }); toast.success(data.message); await load(); } catch (error) { toast.error(error.response?.data?.message || "Listing review failed"); }
    finally { pendingReviews.current.delete(product._id); setReviewing((current) => ({ ...current, [product._id]: false })); }
  };
  return <SellerPage><SellerHeader eyebrow="Marketplace moderation" title="Listing approvals" description="Seller submissions remain hidden from the storefront until the platform administrator approves them."/>
    {loading ? <p role="status" className="surface-card p-6 text-slate-600">Loading pending seller listings…</p> : loadError ? <section role="alert" className="surface-card p-6"><h2 className="font-semibold">Could not load listing approvals</h2><p className="mt-2 text-sm text-slate-600">Retry to see the latest submissions before reviewing a listing.</p><button type="button" onClick={load} className="btn-secondary mt-4">Retry approvals</button></section> : !products.length ? <SellerEmpty title="No listings awaiting approval" description="New or materially edited seller listings will appear here."/> : <div className="grid gap-5 xl:grid-cols-2">{products.map((product) => <article key={product._id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex gap-4"><img src={product.images?.[0]?.url || "/placeholder.png"} alt="" className="h-32 w-24 rounded-xl object-contain"/><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending approval</p><h2 className="mt-2 text-lg font-bold">{product.name}</h2><p className="mt-2 text-sm text-slate-500">Seller: {product.sellerId?.name || product.sellerId?.email || "Unknown"}</p><p className="mt-1 text-sm text-slate-500">{product.variants?.length || 0} variants · ₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div></div><div className="mt-5 grid grid-cols-3 gap-2"><a href={`/admin/edit/${product._id}`} className="btn-secondary py-2 text-sm"><FiExternalLink/> Inspect</a><button disabled={Boolean(reviewing[product._id])} onClick={() => review(product, "rejected")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 text-sm font-semibold text-amber-800"><FiX/> Return</button><button disabled={Boolean(reviewing[product._id])} onClick={() => review(product, "approved")} className="btn-primary py-2 text-sm"><FiCheck/> {reviewing[product._id] ? "Saving…" : "Approve"}</button></div></article>)}</div>}
  </SellerPage>;
}

export default AdminSellerListings;
