import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import logo from "../assets/logo.png";
import { readSession } from "../utils/storage";
import { accountTypeFromUser, homeForAccount } from "../utils/accountSession";

function AdminLogin() {
  const navigate = useNavigate();
  const [customerSession] = useState(() => readSession());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (customerSession && accountTypeFromUser(customerSession.user) !== "customer") navigate(homeForAccount(customerSession.user), { replace: true });
  }, [customerSession, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = challenge ? "/api/auth/admin-login/verify" : "/api/auth/admin-login";
      const payload = challenge ? { challengeToken: challenge.challengeToken, code } : { email: email.trim(), password };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);
      if (data.requiresTwoFactor) {
        setChallenge(data); setPassword(""); setCode("");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data));
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      const requested = sessionStorage.getItem("redirectAfterSellerLogin");
      sessionStorage.removeItem("redirectAfterSellerLogin");
      navigate(requested || homeForAccount(data.user), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Seller sign-in failed. Check the email and password.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!challenge) return;
    setLoading(true); setError("");
    try { const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin-login/resend`, { challengeToken: challenge.challengeToken }); setChallenge(data); setCode(""); }
    catch (requestError) { setError(requestError.response?.data?.message || "A new security code could not be sent."); }
    finally { setLoading(false); }
  };

  return <main className="grid min-h-screen bg-[#f7f5ef] lg:grid-cols-[minmax(360px,.8fr)_minmax(520px,1.2fr)]">
    <section className="relative hidden overflow-hidden bg-[#123b29] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -bottom-44 -left-28 h-96 w-96 rounded-full bg-white/[0.04]"/>
      <Link to="/" className="relative inline-flex w-fit items-center gap-3"><img src={logo} alt="Tamanna's Hut" className="h-16 rounded-xl bg-white px-2 py-1"/></Link>
      <div className="relative max-w-md"><p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">Seller Centre</p><h1 className="mt-4 font-serif text-5xl leading-tight">Manage your business with confidence.</h1><p className="mt-5 leading-7 text-white/65">Platform administrators manage the marketplace. Approved sellers receive a separate workspace for only their own listings and orders.</p><div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-white/55"><FiShield className="text-lg"/> Restricted to approved Seller Centre accounts</div></div>
      <p className="relative text-xs text-white/35">Tamanna&apos;s Hut · Seller operations</p>
    </section>

    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-7 flex items-center justify-between lg:hidden"><img src={logo} alt="Tamanna's Hut" className="h-14 rounded-xl bg-white px-2 py-1 shadow-sm"/><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"><FiArrowLeft/> Store</Link></div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(20,45,32,.12)] sm:p-10">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef5f0] text-xl text-brand-primary"><FiLock/></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#397153]">Secure access</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Seller sign in</h2></div></div>
          <p className="mt-5 text-sm leading-6 text-slate-500">{challenge ? `Enter the six-digit code sent to ${challenge.maskedEmail}. It expires in 10 minutes.` : "Use your platform-administrator or marketplace-seller credentials. A one-time email code protects every Seller Centre sign in."}</p>

          {customerSession?.user && !customerSession.user.isAdmin && customerSession.user.accountType !== "seller" && <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-semibold">Currently shopping as {customerSession.user.name || customerSession.user.email}</p><p className="mt-1 text-blue-700">Signing in here with a Seller Centre account will switch this browser. Your customer account is not being deleted.</p></div>}
          {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}

          {!challenge ? <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Seller Centre email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="field-control mt-2" placeholder="seller@example.com"/></label>
            <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="field-control pr-12" placeholder="Enter your password"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></label>
          </div> : <div className="mt-7"><label className="block text-sm font-semibold text-slate-700">Security code<input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} minLength="6" maxLength="6" className="field-control mt-2 text-center text-2xl tracking-[.35em]" required /></label><div className="mt-4 flex flex-wrap justify-between gap-3 text-sm"><button type="button" onClick={() => { setChallenge(null); setCode(""); setError(""); }} className="font-semibold text-slate-500 hover:text-brand-primary">Use a different account</button><button type="button" onClick={resendCode} disabled={loading} className="font-semibold text-brand-primary hover:underline">Send a new code</button></div></div>}
          <button type="submit" disabled={loading || (challenge && code.length !== 6)} className="btn-primary mt-7 w-full py-4 text-base disabled:cursor-wait disabled:opacity-60">{loading ? "Checking…" : challenge ? "Verify and open Seller Centre" : "Continue securely"}</button>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-5 text-sm sm:flex-row"><Link to="/" className="inline-flex items-center gap-2 font-semibold text-brand-primary"><FiArrowLeft/> Back to storefront</Link><Link to="/forgot-password" className="font-semibold text-slate-500 hover:text-brand-primary">Forgot password?</Link></div><p className="mt-5 text-center text-sm text-slate-500">Received a seller invitation? <Link to="/seller/register" className="font-semibold text-brand-primary hover:underline">Create your seller account</Link></p>
        </form>
      </div>
    </section>
  </main>;
}

export default AdminLogin;
