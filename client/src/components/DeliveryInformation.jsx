import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { readSession } from "../utils/storage";

export default function DeliveryInformation() {
  const [pincode, setPincode] = useState("");
  const [cod, setCod] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const signedIn = Boolean(readSession()?.token);
  const check = async (event) => {
    event.preventDefault();
    setError(""); setResult(null);
    if (!/^\d{6}$/.test(pincode)) { setError("Enter a valid 6-digit pincode"); return; }
    setBusy(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/logistics/postcode/${pincode}`, { params: { cod: cod ? 1 : 0 } });
      if (!data.serviceable) throw new Error("Delivery availability could not be confirmed. Please try again.");
      setResult(data);
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || "Delivery could not be checked. Please try again."); }
    finally { setBusy(false); }
  };
  return <section aria-label="Delivery and returns" className="mt-7 rounded-2xl border bg-slate-50 p-4 sm:p-5">
    <h2 className="font-semibold">Delivery and returns</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">Usually dispatched within 1 business day. Delivery generally takes 3–7 business days after dispatch, depending on your location and courier availability.</p>
    {signedIn ? <form onSubmit={check} className="mt-4 space-y-3">
      <label htmlFor="delivery-pincode" className="block text-sm font-semibold">Check delivery to your pincode</label>
      <div className="flex gap-2"><input id="delivery-pincode" value={pincode} disabled={busy} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, "").slice(0, 6)); setResult(null); setError(""); }} inputMode="numeric" autoComplete="postal-code" maxLength={6} required pattern="[0-9]{6}" placeholder="6-digit pincode" className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2.5"/><button disabled={busy} className="btn-primary shrink-0 text-sm">{busy ? "Checking…" : "Check"}</button></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cod} disabled={busy} onChange={(event) => { setCod(event.target.checked); setResult(null); setError(""); }}/>Check cash on delivery availability</label>
      {result && <p role="status" className="text-sm text-emerald-700">{cod ? "Cash on delivery" : "Prepaid delivery"} available to {result.city}, {result.state}. Availability is confirmed again at checkout.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form> : <p className="mt-3 text-sm"><Link to="/login" onClick={() => sessionStorage.setItem("redirectAfterLogin", `${window.location.pathname}${window.location.search}`)} className="font-semibold text-brand-primary underline">Sign in to check courier availability</Link>. Delivery is verified at checkout.</p>}
    <p className="mt-4 border-t pt-4 text-sm leading-6 text-slate-600">Request a return within 7 days of delivery. Eligibility, item condition and return shipping costs apply. Approved refunds are initiated after the returned item is received and inspected.</p>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-brand-primary"><Link to="/shipping-policy" className="underline">Shipping details</Link><Link to="/return-policy" className="underline">Returns and refunds</Link></div>
  </section>;
}
