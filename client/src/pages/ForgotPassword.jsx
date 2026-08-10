import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [accountMissing, setAccountMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setAccountMissing(false);
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email }); setSent(true); }
    catch (error) { if (error.response?.data?.code === "ACCOUNT_NOT_FOUND") setAccountMissing(true); else toast.error(error.response?.data?.message || "Reset request could not be submitted"); }
    finally { setSubmitting(false); }
  };
  return <main className="mx-auto max-w-md px-6 py-20"><form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><div><h1 className="text-center text-3xl font-bold">Reset your password</h1><p className="mt-3 text-center text-sm leading-6 text-slate-600">Enter your account email and we will send a secure link valid for 30 minutes.</p></div>{sent ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">A reset link has been sent to <strong>{email}</strong>. Check your inbox and spam folder.</div> : <><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setAccountMissing(false); }} placeholder="Email address" autoComplete="email" className="field-control" required/>{accountMissing && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">No account found</p><p className="mt-1">There is no Tamanna&apos;s Hut account registered with <strong>{email}</strong>.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/register" className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Create account</Link><button type="button" onClick={() => { setEmail(""); setAccountMissing(false); }} className="rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold">Try another email</button></div></div>}<button disabled={submitting} className="btn-primary w-full disabled:opacity-60">{submitting ? "Checking…" : "Send reset link"}</button></>}<p className="text-center text-sm"><Link to="/login" className="font-semibold text-brand-primary hover:underline">Back to sign in</Link></p></form></main>;
}
