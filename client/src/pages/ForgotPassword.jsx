import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true);
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email }); setSent(true); }
    catch (error) { toast.error(error.response?.data?.message || "Reset request could not be submitted"); }
    finally { setSubmitting(false); }
  };
  return <main className="mx-auto max-w-md px-6 py-20"><form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><div><h1 className="text-center text-3xl font-bold">Reset your password</h1><p className="mt-3 text-center text-sm leading-6 text-slate-600">Enter your account email and we will send a secure link valid for 30 minutes.</p></div>{sent ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox and spam folder.</div> : <><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="field-control" required/><button disabled={submitting} className="btn-primary w-full disabled:opacity-60">{submitting ? "Sending…" : "Send reset link"}</button></>}<p className="text-center text-sm"><Link to="/login" className="font-semibold text-brand-primary hover:underline">Back to sign in</Link></p></form></main>;
}
