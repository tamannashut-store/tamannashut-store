import { useEffect, useState } from "react";
import axios from "axios";
import { FiCheckCircle, FiClock, FiDollarSign, FiPauseCircle } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function SellerSettlements() {
  const [data, setData] = useState({ settlements: [], summary: {} });
  const [error, setError] = useState("");
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/settlements/seller/mine`).then(({ data: result }) => { if (active) setData(result); }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Settlements could not be loaded"); }); return () => { active = false; }; }, []);
  const cards = [["Eligible", data.summary.eligible, FiDollarSign], ["Processing", data.summary.pending, FiClock], ["On hold", data.summary.held, FiPauseCircle], ["Paid", data.summary.paid, FiCheckCircle]];
  return <SellerPage><SellerHeader eyebrow="Marketplace earnings" title="Settlements" description="A transparent order-level ledger of sales, discounts, marketplace fees, refunds and recorded payouts."/>
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><Icon className="text-xl text-brand-primary"/><p className="mt-4 text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl">{money(value)}</strong></article>)}</section>
    <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="text-lg font-bold">Order settlement ledger</h2><p className="mt-1 text-sm text-slate-500">Paid entries include the administrator-recorded bank reference.</p></div>
      {!error && !data.settlements.length ? <SellerEmpty title="No settlements yet" description="A ledger entry is created when an order contains one of your products."/> : <div className="divide-y">{data.settlements.map((item) => <article key={item._id} className="grid gap-4 p-5 lg:grid-cols-[1fr_repeat(4,minmax(100px,auto))]"><div><div className="flex flex-wrap items-center gap-2"><strong>Order #{String(item.orderId?._id || item.orderId).slice(-8).toUpperCase()}</strong><StatusBadge value={item.status}/></div><p className="mt-1 text-xs text-slate-500">{item.orderId?.createdAt ? new Date(item.orderId.createdAt).toLocaleString("en-IN") : ""}</p>{item.paymentReference && <p className="mt-2 break-all font-mono text-xs text-emerald-700">{item.paymentMethod}: {item.paymentReference}</p>}{item.holdReason && <p className="mt-2 text-xs text-amber-700">Hold: {item.holdReason}</p>}</div><Amount label="Net sales" value={item.netSalesAmount}/><Amount label="Marketplace fee" value={item.commissionAmount}/><Amount label="Refund/adjustment" value={Number(item.refundAmount) - Number(item.adjustmentAmount)}/><Amount label="Payable" value={item.payableAmount} strong/></article>)}</div>}
    </section><p className="mt-5 text-xs leading-5 text-slate-500">This ledger records marketplace calculations. A “Paid” status means the platform administrator recorded a completed transfer; it is not an automatic bank instruction.</p>
  </SellerPage>;
}

const Amount = ({ label, value, strong }) => <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 ${strong ? "text-lg font-bold text-brand-primary" : "font-semibold"}`}>{money(value)}</p></div>;
export default SellerSettlements;
