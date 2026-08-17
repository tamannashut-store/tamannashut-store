import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import logo from "../assets/logo.png";

const initialForm = { name: "", password: "", confirmPassword: "", legalBusinessName: "", gstin: "", pan: "", bankAccountHolder: "", bankAccountNumber: "", ifsc: "" };

function SellerRegister() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/auth/seller-invitations/${token}`)
      .then(({ data }) => { if (active) setInvitation(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "This seller invitation could not be verified"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/seller-invitations/${token}/accept`, { ...form, confirmPassword: undefined });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Seller account could not be created");
    } finally { setSubmitting(false); }
  };

  if (!token) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><img src={logo} alt="Tamanna's Hut" className="mx-auto h-16"/><FiLock className="mx-auto mt-7 text-3xl text-brand-primary"/><h1 className="mt-4 text-3xl font-bold">Invitation required</h1><p className="mt-3 leading-7 text-slate-600">Seller accounts are not public registrations. Ask the store owner to send a secure invitation from Seller Centre.</p><Link to="/admin-login" className="btn-primary mt-7 w-full">Back to seller sign in</Link></section></main>;
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] text-slate-500">Checking secure invitation…</main>;
  if (complete) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><FiCheckCircle className="mx-auto text-5xl text-emerald-600"/><h1 className="mt-5 text-3xl font-bold">Details submitted</h1><p className="mt-3 leading-7 text-slate-600">The store owner will review your GST and settlement details. Seller Centre access will remain locked until approval.</p><Link to="/admin-login" className="btn-primary mt-7 w-full">Go to seller sign in</Link></section></main>;
  if (!invitation) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl"><h1 className="text-3xl font-bold">Invitation unavailable</h1><p role="alert" className="mt-4 text-red-700">{error}</p><Link to="/admin-login" className="btn-secondary mt-7 w-full">Back to seller sign in</Link></section></main>;

  return <main className="min-h-screen bg-[#f7f5ef] px-5 py-10 sm:px-8"><div className="mx-auto max-w-4xl"><header className="mb-7 flex items-center justify-between"><img src={logo} alt="Tamanna's Hut" className="h-16 rounded-xl bg-white px-2 py-1 shadow-sm"/><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"><FiShield/> Secure onboarding</span></header><form onSubmit={submit} className="overflow-hidden rounded-3xl border bg-white shadow-[0_24px_70px_rgba(20,45,32,.12)]"><div className="bg-[#123b29] px-6 py-8 text-white sm:px-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Seller Centre</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Create your seller account</h1><p className="mt-3 text-white/70">Invited email: <strong className="text-white">{invitation.email}</strong></p></div><div className="space-y-8 p-6 sm:p-10">
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <section><h2 className="text-xl font-bold">Account credentials</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="field-label">Full name<input required minLength="2" maxLength="80" autoComplete="name" value={form.name} onChange={(event) => change("name", event.target.value)} className="field-control mt-2"/></label><label className="field-label">Password<div className="relative mt-2"><input required minLength="8" maxLength="128" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => change("password", event.target.value)} className="field-control pr-12"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></label><label className="field-label md:col-start-2">Confirm password<input required minLength="8" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => change("confirmPassword", event.target.value)} className="field-control mt-2"/></label></div></section>
    <section className="border-t pt-8"><h2 className="text-xl font-bold">Business verification</h2><p className="mt-2 text-sm text-slate-500">Enter details exactly as registered. GSTIN is checked for format and PAN consistency before submission.</p><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="field-label md:col-span-2">Legal business name<input required maxLength="120" value={form.legalBusinessName} onChange={(event) => change("legalBusinessName", event.target.value)} className="field-control mt-2"/></label><label className="field-label">GSTIN<input required minLength="15" maxLength="15" autoCapitalize="characters" value={form.gstin} onChange={(event) => change("gstin", event.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="19ABCDE1234F1Z5"/></label><label className="field-label">PAN<input required minLength="10" maxLength="10" autoCapitalize="characters" value={form.pan} onChange={(event) => change("pan", event.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="ABCDE1234F"/></label></div></section>
    <section className="border-t pt-8"><h2 className="text-xl font-bold">Settlement bank account</h2><p className="mt-2 text-sm text-slate-500">Sensitive identifiers are encrypted before storage. They are visible only to the store owner during verification.</p><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="field-label md:col-span-2">Account holder name<input required maxLength="120" autoComplete="name" value={form.bankAccountHolder} onChange={(event) => change("bankAccountHolder", event.target.value)} className="field-control mt-2"/></label><label className="field-label">Account number<input required inputMode="numeric" minLength="6" maxLength="20" autoComplete="off" value={form.bankAccountNumber} onChange={(event) => change("bankAccountNumber", event.target.value.replace(/\D/g, ""))} className="field-control mt-2"/></label><label className="field-label">IFSC code<input required minLength="11" maxLength="11" autoCapitalize="characters" value={form.ifsc} onChange={(event) => change("ifsc", event.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="ABCD0123456"/></label></div></section>
    <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Submitting details does not mean they are verified. The store owner must compare GST registration and bank proof before activating access.</div><button disabled={submitting} className="btn-primary w-full py-4 text-base disabled:opacity-60">{submitting ? "Submitting securely…" : "Submit for verification"}</button>
  </div></form></div></main>;
}

export default SellerRegister;
