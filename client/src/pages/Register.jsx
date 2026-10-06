import { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";
import { startCustomerSession } from "../utils/customerSession";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [channel, setChannel] = useState(searchParams.get("channel") === "email" ? "email" : "phone");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [code, setCode] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sendCode = async () => {
    if (!termsAccepted) return setError("Accept the Terms and Privacy Policy to create an account.");
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/customer-otp/send`, { purpose: "register", channel, contact, name, termsAccepted, marketingConsent });
      setChallengeToken(data.challengeToken); setCode(""); setResendAt(Date.now() + 60_000); toast.success(data.message);
    } catch (requestError) { setError(requestError.response?.data?.message || "Verification code could not be sent."); }
    finally { setLoading(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!challengeToken) return sendCode();
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/customer-otp/check`, { purpose: "register", challengeToken, code });
      const destination = await startCustomerSession(data);
      toast.success("Your account is ready"); navigate(destination, { replace: true });
    } catch (requestError) { setError(requestError.response?.data?.message || "Your account could not be created. Please try again."); }
    finally { setLoading(false); }
  };
  const reset = () => { setChallengeToken(""); setCode(""); setError(""); };
  return <AuthShell eyebrow="Create customer account" title="Join Tamanna's Hut" description="Use just your mobile number or email. Verify a code and you're ready to shop." asideTitle="Everything for easier shopping." asideCopy="Create one secure account for your orders, saved bag and delivery details." asideItems={["No password needed", "Order and return tracking", "Saved bag across devices"]} icon={FiUserPlus}>
    <form onSubmit={submit} className="mt-7">
      <div className="grid grid-cols-2 gap-2" aria-label="Signup method">{[["phone", "Mobile number"], ["email", "Email address"]].map(([method, label]) => <button key={method} type="button" disabled={loading} aria-pressed={channel === method} onClick={() => { setChannel(method); setContact(""); reset(); }} className={channel === method ? "btn-primary" : "btn-secondary"}>{label}</button>)}</div>
      <div className="mt-5 space-y-5">
        <label className="block text-sm font-semibold text-slate-700">{channel === "phone" ? "Mobile number" : "Email address"}<input type={channel === "phone" ? "tel" : "email"} value={contact} onChange={(event) => { setContact(event.target.value); reset(); }} autoComplete={channel === "phone" ? "tel" : "email"} placeholder={channel === "phone" ? "10-digit Indian mobile number" : "you@example.com"} maxLength={channel === "phone" ? 16 : 254} disabled={loading} className="field-control mt-2" required/></label>
        {!challengeToken && <label className="block text-sm font-semibold text-slate-700">Name (optional)<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={80} className="field-control mt-2"/></label>}
        {challengeToken && <><label className="block text-sm font-semibold text-slate-700">One-time code<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} minLength={channel === "email" ? 6 : 4} maxLength={10} className="field-control mt-2" required/></label><button type="button" disabled={loading} onClick={() => Date.now() < resendAt ? setError("Please wait one minute before requesting another code") : sendCode()} className="text-sm font-semibold text-brand-primary">Resend code</button></>}
      </div>
      {!challengeToken && <><label className="mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4" required/><span>I accept the <Link to="/terms-conditions" target="_blank" className="font-semibold underline">Terms</Link> and <Link to="/privacy-policy" target="_blank" className="font-semibold underline">Privacy Policy</Link>.</span></label>{channel === "email" && <label className="mt-3 flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 h-4 w-4"/><span>Send me shopping emails (optional).</span></label>}</>}
      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-4 disabled:opacity-60">{loading ? "Please wait…" : challengeToken ? "Verify & create account" : "Send verification code"}</button>
    </form>
    <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-brand-primary hover:underline">Sign in</Link></p>
  </AuthShell>;
}
