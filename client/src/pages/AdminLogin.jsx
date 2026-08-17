import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import logo from "../assets/logo.png";

function readSession() {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
}

function AdminLogin() {
  const navigate = useNavigate();
  const [customerSession] = useState(() => readSession());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customerSession?.user?.isAdmin) navigate("/admin/dashboard", { replace: true });
  }, [customerSession, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin-login`, { email: email.trim(), password });
      localStorage.setItem("user", JSON.stringify(data));
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Seller sign-in failed. Check the email and password.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen bg-[#f7f5ef] lg:grid-cols-[minmax(360px,.8fr)_minmax(520px,1.2fr)]">
    <section className="relative hidden overflow-hidden bg-[#123b29] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -bottom-44 -left-28 h-96 w-96 rounded-full bg-white/[0.04]"/>
      <Link to="/" className="relative inline-flex w-fit items-center gap-3"><img src={logo} alt="Tamanna's Hut" className="h-16 rounded-xl bg-white px-2 py-1"/></Link>
      <div className="relative max-w-md"><p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">Seller Centre</p><h1 className="mt-4 font-serif text-5xl leading-tight">Manage every order with confidence.</h1><p className="mt-5 leading-7 text-white/65">Secure access to listings, fulfilment, returns, reviews, analytics and production operations.</p><div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-white/55"><FiShield className="text-lg"/> Restricted to authorised store administrators</div></div>
      <p className="relative text-xs text-white/35">Tamanna&apos;s Hut · Seller operations</p>
    </section>

    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-7 flex items-center justify-between lg:hidden"><img src={logo} alt="Tamanna's Hut" className="h-14 rounded-xl bg-white px-2 py-1 shadow-sm"/><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"><FiArrowLeft/> Store</Link></div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(20,45,32,.12)] sm:p-10">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef5f0] text-xl text-brand-primary"><FiLock/></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#397153]">Secure access</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Seller sign in</h2></div></div>
          <p className="mt-5 text-sm leading-6 text-slate-500">Use the administrator credentials created for your store. Customer accounts cannot access Seller Centre.</p>

          {customerSession?.user && !customerSession.user.isAdmin && <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-semibold">Currently shopping as {customerSession.user.name || customerSession.user.email}</p><p className="mt-1 text-blue-700">Signing in here with an administrator account will switch this browser to Seller Centre. Your customer account is not being deleted.</p></div>}
          {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Administrator email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="field-control mt-2" placeholder="admin@example.com"/></label>
            <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="field-control pr-12" placeholder="Enter your password"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></label>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-7 w-full py-4 text-base disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in…" : "Open Seller Centre"}</button>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-5 text-sm sm:flex-row"><Link to="/" className="inline-flex items-center gap-2 font-semibold text-brand-primary"><FiArrowLeft/> Back to storefront</Link><Link to="/forgot-password" className="font-semibold text-slate-500 hover:text-brand-primary">Forgot password?</Link></div><p className="mt-5 text-center text-sm text-slate-500">Received a seller invitation? <Link to="/seller/register" className="font-semibold text-brand-primary hover:underline">Create your seller account</Link></p>
        </form>
      </div>
    </section>
  </main>;
}

export default AdminLogin;
