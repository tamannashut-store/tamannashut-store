import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [accountMissing, setAccountMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setAccountMissing(false);
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email: email.trim() }); setSent(true); }
    catch (error) { if (error.response?.data?.code === "ACCOUNT_NOT_FOUND") setAccountMissing(true); else toast.error(error.response?.data?.message || "Reset request could not be submitted"); }
    finally { setSubmitting(false); }
  };
  return <AuthShell eyebrow="Account recovery" title={sent ? "Check your inbox" : "Reset your password"} description={sent ? "We sent a secure reset link if delivery was successful." : "Enter the email for your customer or Seller Centre account. The secure link remains valid for 30 minutes."} asideTitle="A secure way back to your account." asideCopy="Password reset links are single-use and expire automatically." asideItems={["Secure 30-minute reset link", "Existing sessions close after reset", "Your account details remain protected"]} icon={FiMail}>
    {sent ? <div className="mt-7"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800"><p className="font-semibold">Reset email requested</p><p className="mt-1">Check <strong className="break-all">{email}</strong>, including the spam folder.</p></div><button type="button" onClick={() => { setSent(false); setEmail(""); }} className="btn-secondary mt-5 w-full">Use another email</button></div> : <form onSubmit={submit} className="mt-7">
      <label className="block text-sm font-semibold text-slate-700">Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setAccountMissing(false); }} autoComplete="email" className="field-control mt-2" required /></label>
      {accountMissing && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">No account found</p><p className="mt-1 leading-6">There is no Tamanna&apos;s Hut account registered with <strong className="break-all">{email}</strong>.</p><Link to="/register" className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 font-semibold text-white">Create a customer account</Link><p className="mt-3 text-xs leading-5">Seller applicants must use the email from their invitation or contact the platform administrator.</p></div>}
      <button disabled={submitting} className="btn-primary mt-6 w-full py-4 disabled:opacity-60">{submitting ? "Sending secure link…" : "Send reset link"}</button>
    </form>}
    <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t pt-6 text-sm"><Link to="/login" className="inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"><FiArrowLeft/> Customer sign in</Link><Link to="/admin-login" className="font-semibold text-brand-primary hover:underline">Seller Centre sign in</Link></div>
  </AuthShell>;
}
