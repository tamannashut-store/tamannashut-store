import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function AdminSettlements() {
  const [data, setData] = useState({ settlements: [], summary: {} });
  const [status, setStatus] = useState("");
  const load = () => axios.get(`${import.meta.env.VITE_API_URL}/api/settlements`).then(({ data: result }) => setData(result)).catch((error) => toast.error(error.response?.data?.message || "Settlements could not be loaded"));
  useEffect(load, []);
  const act = async (item, action) => {
    let payload = { action };
    if (action === "hold") { const note = window.prompt("Reason for holding this settlement:", ""); if (!note) return; payload.note = note; }
    if (action === "adjust") { const amount = window.prompt("Adjustment amount (negative for deduction):", "0"); if (amount === null) return; const note = window.prompt("Reason for this adjustment:", ""); if (!note) return; payload = { action, amount: Number(amount), note }; }
    if (action === "mark_paid") { const method = window.prompt("Payment method:", "Bank transfer"); if (!method) return; const reference = window.prompt("Bank transaction reference:", ""); if (!reference) return; payload = { action, method, reference }; }
    if (!window.confirm(`Confirm ${action.replace("_", " ")} for ${money(item.payableAmount)}?`)) return;
    try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/settlements/${item._id}`, payload); toast.success("Settlement updated"); await load(); } catch (error) { toast.error(error.response?.data?.message || "Settlement could not be updated"); }
  };
  const records = data.settlements.filter((item) => !status || item.status === status);
  return <SellerPage><SellerHeader eyebrow="Finance operations" title="Seller settlements" description="Review order allocations and record seller payouts without exposing one seller’s ledger to another."/>
    <section className="mb-5 grid gap-4 sm:grid-cols-3"><Summary label="Eligible to pay" value={data.summary.eligible}/><Summary label="On hold" value={data.summary.held}/><Summary label="Paid" value={data.summary.paid}/></section>
    <div className="mb-5 flex justify-end"><select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control max-w-xs"><option value="">All settlement states</option>{["pending","eligible","held","paid","reversed"].map((value) => <option key={value}>{value}</option>)}</select></div>
    {!records.length ? <SellerEmpty title="No settlement entries" description="Order-level seller allocations will appear here."/> : <div className="space-y-4">{records.map((item) => <article key={item._id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{item.sellerId?.name || item.sellerId?.email || "Seller"}</h2><StatusBadge value={item.status}/></div><p className="mt-1 text-sm text-slate-500">Order #{String(item.orderId?._id || item.orderId).slice(-8).toUpperCase()} · {item.orderId?.status}</p></div><strong className="text-2xl text-brand-primary">{money(item.payableAmount)}</strong></div><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-5"><Detail label="Gross" value={item.grossAmount}/><Detail label="Discount" value={item.allocatedDiscount}/><Detail label={`Fee (${item.commissionPercent}%)`} value={item.commissionAmount}/><Detail label="Refund" value={item.refundAmount}/><Detail label="Adjustment" value={item.adjustmentAmount}/></div>{item.holdReason && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Hold reason: {item.holdReason}</p>}<div className="mt-4 flex flex-wrap gap-2">{!["paid","reversed"].includes(item.status) && <button onClick={() => act(item, "adjust")} className="btn-secondary text-sm">Add adjustment</button>}{!["held","paid","reversed"].includes(item.status) && <button onClick={() => act(item, "hold")} className="btn-secondary text-sm">Place on hold</button>}{item.status === "held" && item.manualHold && <button onClick={() => act(item, "release")} className="btn-secondary text-sm">Release hold</button>}{item.status === "eligible" && <button onClick={() => act(item, "mark_paid")} className="btn-primary text-sm">Record payout</button>}</div></article>)}</div>}
  </SellerPage>;
}
const Summary = ({ label, value }) => <article className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-2xl">{money(value)}</strong></article>;
const Detail = ({ label, value }) => <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{money(value)}</p></div>;
export default AdminSettlements;
