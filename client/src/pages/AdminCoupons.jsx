import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPercent, FiPlus } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const loadCoupons = async () => {
    try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/coupons`); setCoupons(Array.isArray(data) ? data : []); }
    catch { toast.error("Could not load coupons"); }
  };
  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/coupons`)
      .then(({ data }) => { if (active) setCoupons(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) toast.error("Could not load coupons"); });
    return () => { active = false; };
  }, []);

  const createCoupon = async (event) => {
    event.preventDefault();
    if (!code.trim() || Number(discount) <= 0 || Number(discount) > 100) return toast.error("Enter a valid code and discount");
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons`, { code: code.trim().toUpperCase(), discount: Number(discount) }); setCode(""); setDiscount(""); toast.success("Coupon created"); loadCoupons(); }
    catch (error) { toast.error(error.response?.data?.message || "Coupon could not be created"); }
  };

  return <SellerPage>
    <SellerHeader title="Coupons" description="Create and review promotional codes available at checkout." />
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={createCoupon} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef5f0] text-[#28583d]"><FiPercent /></div><h2 className="mt-5 text-lg font-semibold">Create a coupon</h2><label className="field-label mt-5">Coupon code<input className="field-control mt-2 uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" maxLength={30} /></label><label className="field-label mt-4">Discount percentage<input className="field-control mt-2" type="number" min="1" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" /></label><button className="btn-primary mt-6 w-full"><FiPlus /> Create coupon</button></form>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold">Available coupons</h2><p className="mt-1 text-sm text-slate-500">{coupons.length} promotion{coupons.length === 1 ? "" : "s"}</p></div>{coupons.length === 0 ? <SellerEmpty title="No coupons created" description="Create the first promotion using the form." /> : <div className="divide-y divide-slate-100">{coupons.map((coupon) => <div key={coupon._id} className="flex items-center justify-between px-6 py-5"><div><p className="font-mono font-bold tracking-wide text-slate-900">{coupon.code}</p><p className="mt-1 text-sm text-slate-500">Applied at checkout</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">{coupon.discount}% off</span></div>)}</div>}</section>
    </div>
  </SellerPage>;
}
export default AdminCoupons;
