import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCheck, FiExternalLink, FiX } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

function AdminSellerListings() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, { params: { approval: "pending", limit: 100 } }); setProducts(data.products || []); } catch (error) { toast.error(error.response?.data?.message || "Seller listings could not be loaded"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const review = async (product, approvalStatus) => {
    const approvalNote = approvalStatus === "rejected" ? window.prompt("Explain what the seller must correct:", "") : "";
    if (approvalStatus === "rejected" && (approvalNote === null || approvalNote.trim().length < 5)) return;
    if (!window.confirm(`${approvalStatus === "approved" ? "Approve and publish" : "Return"} ${product.name}?`)) return;
    try { const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/products/admin/${product._id}/approval`, { approvalStatus, approvalNote }); toast.success(data.message); await load(); } catch (error) { toast.error(error.response?.data?.message || "Listing review failed"); }
  };
  return <SellerPage><SellerHeader eyebrow="Marketplace moderation" title="Listing approvals" description="Seller submissions remain hidden from the storefront until the platform administrator approves them."/>
    {!loading && !products.length ? <SellerEmpty title="No listings awaiting approval" description="New or materially edited seller listings will appear here."/> : <div className="grid gap-5 xl:grid-cols-2">{products.map((product) => <article key={product._id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex gap-4"><img src={product.images?.[0]?.url || "/placeholder.png"} alt="" className="h-32 w-24 rounded-xl object-cover"/><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending approval</p><h2 className="mt-2 text-lg font-bold">{product.name}</h2><p className="mt-2 text-sm text-slate-500">Seller: {product.sellerId?.name || product.sellerId?.email || "Unknown"}</p><p className="mt-1 text-sm text-slate-500">{product.variants?.length || 0} variants · ₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div></div><div className="mt-5 grid grid-cols-3 gap-2"><a href={`/admin/edit/${product._id}`} className="btn-secondary py-2 text-sm"><FiExternalLink/> Inspect</a><button onClick={() => review(product, "rejected")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 text-sm font-semibold text-amber-800"><FiX/> Return</button><button onClick={() => review(product, "approved")} className="btn-primary py-2 text-sm"><FiCheck/> Approve</button></div></article>)}</div>}
  </SellerPage>;
}

export default AdminSellerListings;
