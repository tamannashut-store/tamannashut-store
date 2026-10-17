import { useState } from "react";
import axios from "axios";
import { BankProofInput } from "./BankProof";

const fields = [
  ["legalBusinessName", "Legal proprietor name"], ["tradeName", "Store name"],
  ["businessPhone", "Business phone"], ["authorizedSignatoryName", "Authorised signatory"],
  ["pan", "PAN"], ["enrolmentNumber", "GST Portal enrolment number"],
  ["registeredAddressLine1", "Business address"], ["registeredAddressLine2", "Address line 2"],
  ["registeredAddressCity", "City"], ["registeredAddressPincode", "Pincode"],
  ["bankAccountHolder", "Bank account holder"], ["bankAccountNumber", "Bank account number"],
  ["confirmBankAccountNumber", "Confirm bank account number"], ["ifsc", "IFSC"],
];
export default function RestrictedSellerSetup({ onSaved }) {
  const [values, setValues] = useState({}); const [proof, setProof] = useState(null);
  const [confirmed, setConfirmed] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault(); if (!proof || !confirmed || busy) return;
    if (!window.confirm("Enable Kismat Collection for West Bengal sales only, with payouts held until GST is verified?")) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData();
      form.append("application", JSON.stringify({ ...values, userId: "6ad310f1a547785020f5a253", businessType: "proprietorship", registeredAddressState: "West Bengal", pickupSameAsRegistered: true, bankAccountType: "savings", eligibilityConfirmed: true, bankDeclaration: true, termsAccepted: true }));
      form.append("bankProof", proof);
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/seller-team/enrolment`, form);
      setMessage(data.message); setValues({}); setProof(null); setConfirmed(false); onSaved?.();
    } catch (error) { setMessage(error.response?.data?.message || "Restricted seller setup failed"); }
    finally { setBusy(false); }
  };
  return <details className="mt-6 rounded-2xl border bg-white p-6"><summary className="cursor-pointer font-semibold">Owner-approved enrolment seller</summary>
    <p className="mt-3 text-sm text-slate-600">For the approved Kismat Collection account only. West Bengal delivery; payouts stay held until normal GST approval. The seller keeps her existing password and Seller Centre security code.</p>
    <form onSubmit={submit} className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="text-sm">{label}<input required={key !== "registeredAddressLine2"} value={values[key] || ""} onChange={(event) => setValues({ ...values, [key]: event.target.value })} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>)}</div>
    <BankProofInput required onChange={setProof}/>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>I reviewed the official enrolment eligibility and bank ownership document, confirmed West Bengal-only selling, and have the seller’s acceptance of seller terms and data processing.</span></label>
    {message && <p role="status" className="text-sm">{message}</p>}
    <button disabled={!proof || !confirmed || busy} className="btn-primary disabled:opacity-40">{busy ? "Saving…" : "Enable restricted seller"}</button></form>
  </details>;
}
