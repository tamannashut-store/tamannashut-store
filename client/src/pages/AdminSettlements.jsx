import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const api = `${import.meta.env.VITE_API_URL}/api/settlements`;
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AdminSettlements() {
  const [data, setData] = useState({ settlements: [], summary: {} });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const load = () => axios.get(api).then(({ data: result }) => setData(result)).catch((error) => toast.error(error.response?.data?.message || "Settlements could not be loaded"));
  useEffect(load, []);

  const update = async (item, payload, confirmation) => {
    if (!window.confirm(confirmation)) return;
    setBusy(item._id);
    try { await axios.patch(`${api}/${item._id}`, payload); toast.success("Settlement updated"); await load(); }
    catch (error) { toast.error(error.response?.data?.message || "Settlement could not be updated"); }
    finally { setBusy(""); }
  };
  const act = async (item, action) => {
    if (action === "hold") { const note = window.prompt("Reason for holding this settlement:", ""); if (!note) return; return update(item, { action, note }, `Place ${money(item.payableAmount)} on hold?`); }
    if (action === "release") return update(item, { action }, `Release the hold on ${money(item.payableAmount)}?`);
    if (action === "adjust") {
      const amount = window.prompt("Adjustment amount (negative for a deduction, positive for a credit):", "0"); if (amount === null) return;
      const category = window.prompt("Category: shipping, return_shipping, tax_withholding, fee_correction, goodwill or other", "other"); if (category === null) return;
      const note = window.prompt("Reason for this adjustment:", ""); if (!note) return;
      return update(item, { action, amount: Number(amount), category, note }, `Add this ${money(Number(amount))} adjustment? Existing adjustments will be preserved.`);
    }
    if (["initiate_payout", "retry_payout"].includes(action)) {
      const method = window.prompt("Payout method:", item.paymentMethod || "Bank transfer"); if (!method) return;
      const note = window.prompt("Optional internal payout note:", "") ?? "";
      return update(item, { action, method, note }, `${action === "retry_payout" ? "Retry" : "Start"} payout of ${money(item.payableAmount)}?`);
    }
    if (action === "mark_paid") {
      const reference = window.prompt("Confirmed bank transaction reference:", ""); if (!reference) return;
      return update(item, { action, method: item.paymentMethod, reference }, `Confirm that ${money(item.payableAmount)} reached the seller account?`);
    }
    if (action === "mark_failed") { const note = window.prompt("Bank or gateway failure reason:", ""); if (!note) return; return update(item, { action, note }, "Record this payout attempt as failed?"); }
  };
  const download = async (item) => {
    try { const response = await axios.get(`${api}/${item._id}/statement`, { responseType: "blob" }); const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = `settlement-${String(item._id).slice(-8).toUpperCase()}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
    catch { toast.error("Settlement statement could not be downloaded"); }
  };
  const records = data.settlements.filter((item) => !status || item.status === status);
  const locked = (item) => busy === item._id;

  return <SellerPage><SellerHeader eyebrow="Finance operations" title="Seller settlements" description="Reconcile every seller payout through a traceable processing, success or failure workflow." action={<button onClick={load} className="btn-secondary"><FiRefreshCw/> Refresh</button>}/>
    <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Summary label="Eligible" value={data.summary.eligible}/><Summary label="Processing" value={data.summary.processing}/><Summary label="Failed" value={data.summary.failed} alert/><Summary label="On hold" value={data.summary.held}/><Summary label="Paid" value={data.summary.paid}/></section>
    <div className="mb-5 flex justify-end"><select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control max-w-xs"><option value="">All settlement states</option>{["pending","eligible","held","processing","failed","paid","reversed"].map((value) => <option key={value}>{value}</option>)}</select></div>
    {!records.length ? <SellerEmpty title="No settlement entries" description="Order-level seller allocations will appear here."/> : <div className="space-y-4">{records.map((item) => <article key={item._id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{item.sellerId?.name || item.sellerId?.email || "Seller"}</h2><StatusBadge value={item.status}/>{item.reconciliationStatus === "exception" && <span className="text-xs font-bold text-red-700">Reconciliation exception</span>}</div><p className="mt-1 text-sm text-slate-500">Order #{String(item.orderId?._id || item.orderId).slice(-8).toUpperCase()} · {item.orderId?.status}</p></div><div className="text-left lg:text-right"><strong className="text-2xl text-brand-primary">{money(item.payableAmount)}</strong><p className="mt-1 text-xs text-slate-500">{item.payoutAttempts?.length || 0} payout attempt(s)</p></div></div>
      <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3 xl:grid-cols-6"><Detail label="Gross" value={item.grossAmount}/><Detail label="Discount" value={item.allocatedDiscount}/><Detail label={`Fee (${item.commissionPercent}%)`} value={item.commissionAmount}/><Detail label="Refund" value={item.refundAmount}/><Detail label="Adjustments" value={item.adjustmentAmount}/><Detail label="Payable" value={item.payableAmount} strong/></div>
      {item.holdReason && <Notice tone="amber">Hold reason: {item.holdReason}</Notice>}{item.payoutFailureReason && <Notice tone="red">Latest payout failure: {item.payoutFailureReason}</Notice>}{item.paymentReference && <Notice tone="green">Reconciled payout: {item.paymentMethod} · {item.paymentReference}</Notice>}
      {!!item.adjustments?.length && <details className="mt-3 rounded-xl border p-3"><summary className="cursor-pointer text-sm font-semibold">Adjustment ledger ({item.adjustments.length})</summary><div className="mt-3 divide-y">{item.adjustments.map((entry) => <div key={entry._id || `${entry.createdAt}-${entry.amount}`} className="grid gap-1 py-2 text-xs sm:grid-cols-[150px_1fr_auto]"><span className="capitalize text-slate-500">{String(entry.category).replaceAll("_", " ")}</span><span>{entry.note}</span><strong>{money(entry.amount)}</strong></div>)}</div></details>}
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={locked(item)} onClick={() => download(item)} className="btn-secondary text-sm"><FiDownload/> Statement</button>{!["paid","reversed","processing"].includes(item.status) && <button disabled={locked(item)} onClick={() => act(item, "adjust")} className="btn-secondary text-sm">Add adjustment</button>}{!["held","paid","reversed","processing"].includes(item.status) && <button disabled={locked(item)} onClick={() => act(item, "hold")} className="btn-secondary text-sm">Place on hold</button>}{item.status === "held" && item.manualHold && <button disabled={locked(item)} onClick={() => act(item, "release")} className="btn-secondary text-sm">Release hold</button>}{item.status === "eligible" && <button disabled={locked(item)} onClick={() => act(item, "initiate_payout")} className="btn-primary text-sm">Start payout</button>}{item.status === "processing" && <><button disabled={locked(item)} onClick={() => act(item, "mark_paid")} className="btn-primary text-sm">Confirm paid</button><button disabled={locked(item)} onClick={() => act(item, "mark_failed")} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Record failure</button></>}{item.status === "failed" && <button disabled={locked(item)} onClick={() => act(item, "retry_payout")} className="btn-primary text-sm">Retry payout</button>}</div>
    </article>)}</div>}
  </SellerPage>;
}
const Summary = ({ label, value, alert }) => <article className={`rounded-2xl border bg-white p-5 shadow-sm ${alert && Number(value) > 0 ? "border-red-200" : ""}`}><p className="text-sm text-slate-500">{label}</p><strong className={`mt-2 block text-2xl ${alert && Number(value) > 0 ? "text-red-700" : ""}`}>{money(value)}</strong></article>;
const Detail = ({ label, value, strong }) => <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 ${strong ? "font-bold text-brand-primary" : "font-semibold"}`}>{money(value)}</p></div>;
const Notice = ({ tone, children }) => <p className={`mt-3 rounded-xl p-3 text-sm ${tone === "red" ? "bg-red-50 text-red-800" : tone === "green" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{children}</p>;
export default AdminSettlements;
