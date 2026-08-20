import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import AuthShell from "../components/AuthShell";

const guestCart = () => { try { const value = JSON.parse(localStorage.getItem("guest_cart")); return Array.isArray(value) ? value : []; } catch { return []; } };

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const started = useRef(false);
  const [email, setEmail] = useState(params.get("email") || "");
  const [status, setStatus] = useState(token ? "verifying" : "waiting");
  const [message, setMessage] = useState(token ? "Checking your secure verification link…" : "We sent a private activation link to your email.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, { token }).then(async ({ data }) => {
      localStorage.setItem("user", JSON.stringify(data)); axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      const items = guestCart();
      if (items.length) {
        try { await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, { items: items.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })) }); localStorage.removeItem("guest_cart"); window.dispatchEvent(new Event("cartUpdated")); }
        catch { /* The verified account remains valid; the customer can review the local bag. */ }
      }
      setStatus("verified"); setMessage(data.message || "Your email is verified and your account is ready.");
    }).catch((error) => { setStatus("error"); setMessage(error.response?.data?.message || "This verification link could not be used."); });
  }, [token]);

  const resend = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/resend`, { email: email.trim() }); setStatus("waiting"); setMessage(data.message); }
    catch (error) { setStatus("error"); setMessage(error.response?.data?.message || "A new verification link could not be sent."); }
    finally { setBusy(false); }
  };

  return <AuthShell eyebrow="Email verification" title={status === "verified" ? "Account activated" : "Verify your email"} description="Email verification protects your saved bag, orders and personal details from unauthorised account creation." asideTitle="One quick security check." asideCopy="The activation link is private, single-use and expires automatically." asideItems={["24-hour secure link", "Existing customers remain unaffected", "Your bag is kept while you verify"]} icon={status === "verified" ? FiCheckCircle : FiMail}>
    <div className={`mt-7 rounded-2xl border p-5 text-sm leading-6 ${status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={status === "error" ? "alert" : "status"}>{message}</div>
    {status === "verified" ? <button type="button" onClick={() => { const destination = sessionStorage.getItem("redirectAfterLogin"); sessionStorage.removeItem("redirectAfterLogin"); navigate(destination || "/profile", { replace: true }); }} className="btn-primary mt-6 w-full py-4">Continue to your account</button> : <form onSubmit={resend} className="mt-6"><label className="block text-sm font-semibold text-slate-700">Account email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="field-control mt-2" required /></label><button disabled={busy || status === "verifying"} className="btn-secondary mt-4 w-full">{busy ? "Sending…" : "Send a new verification link"}</button></form>}
    <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">Already verified? <Link to="/login" className="font-semibold text-brand-primary hover:underline">Sign in</Link></p>
  </AuthShell>;
}
