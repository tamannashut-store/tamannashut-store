import { useEffect, useState } from "react";
import axios from "axios";

const blank = { method: "UPI", holderName: "", upiId: "", accountNumber: "", confirmAccountNumber: "", ifsc: "" };
export default function RefundDetailsForm({ orderId }) {
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders/refund-details/${orderId}`).then(({ data }) => { if (active) setSaved(data.submitted ? data : null); }).catch(() => { if (active) setError("Saved refund details could not be checked. Please try again."); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [orderId]);
  const change = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(""); };
  const submit = async (event) => {
    event.preventDefault();
    if (form.method === "Bank transfer" && form.accountNumber !== form.confirmAccountNumber) { setError("Bank account numbers do not match"); return; }
    setBusy(true); setError("");
    try {
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/refund-details/${orderId}`, form);
      setSaved(data); setEditing(false); setForm(blank);
      window.dispatchEvent(new Event("refund-details-updated"));
    } catch (requestError) { setError(requestError.response?.data?.message || "Details could not be saved. Please try again."); }
    finally { setBusy(false); }
  };
  const field = (key, label, props = {}) => <label className="block text-sm font-semibold">{label}<input className="field-control mt-2" required value={form[key]} disabled={busy || checking} onChange={(event) => change(key, event.target.value)} {...props}/></label>;
  return <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5" aria-label="Refund payment details">
    <h3 className="font-semibold">{saved && !editing ? "Refund details received" : "Provide details to receive your refund"}</h3>
    <p className="mt-2 text-sm text-slate-600">Your COD refund is pending. Choose UPI or bank transfer. We will update your order once payment is completed.</p>
    <p className="mt-2 text-xs text-slate-600">These details are stored encrypted and available to the store administrator to arrange your refund.</p>
    <p className="mt-2 text-xs text-slate-600">These details are stored encrypted and available to the store administrator to arrange your refund.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {saved && !editing ? <><p role="status" className="mt-3 text-sm font-semibold">{saved.method} · {saved.maskedDestination}</p><button type="button" onClick={() => setEditing(true)} className="btn-secondary mt-3">Update refund details</button></> : <form onSubmit={submit} className="mt-4 space-y-4" autoComplete="off">
      <label className="block text-sm font-semibold">Refund method<select className="field-control mt-2" value={form.method} disabled={busy} onChange={(event) => setForm({ ...blank, method: event.target.value })}><option>UPI</option><option>Bank transfer</option></select></label>
      {field("holderName", "Account holder name", { minLength: 2, maxLength: 120 })}
      {form.method === "UPI" ? field("upiId", "UPI ID", { placeholder: "name@bank", maxLength: 165 }) : <>{field("accountNumber", "Bank account number", { inputMode: "numeric", pattern: "[0-9]{6,20}", maxLength: 20 })}{field("confirmAccountNumber", "Confirm bank account number", { inputMode: "numeric", maxLength: 20 })}{field("ifsc", "IFSC code", { maxLength: 11 })}</>}
      <p className="text-xs text-slate-600">Check your details carefully. We never need your UPI PIN, OTP, password or card details.</p>
      <button disabled={busy || checking} className="btn-primary w-full">{checking ? "Checking saved details…" : busy ? "Saving…" : "Save refund details"}</button>
      {saved && <button type="button" disabled={busy} onClick={() => { setEditing(false); setForm(blank); }} className="btn-secondary w-full">Cancel update</button>}
    </form>}
  </section>;
}
