import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", marketingConsent: false, termsAccepted: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const change = (event) => { setError(""); setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value })); };

  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password) || form.password.length < 8) return setError("Use at least 8 characters with at least one letter and one number.");
    if (form.password !== form.confirmPassword) return setError("The two passwords do not match.");
    if (!form.termsAccepted) return setError("Accept the Terms and Privacy Policy to create an account.");
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, { name: form.name.trim(), email: form.email.trim(), password: form.password, marketingConsent: form.marketingConsent, termsAccepted: form.termsAccepted });
      toast.success(data.message || "Account created. Verify your email to continue");
      navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email.trim())}`, { replace: true });
    } catch (requestError) { setError(requestError.response?.data?.message || "Your account could not be created. Please try again."); }
    finally { setLoading(false); }
  };

  return <AuthShell eyebrow="Create customer account" title="Join Tamanna's Hut" description="Save your bag, track orders and check out faster on every device." asideTitle="Everything for easier shopping." asideCopy="Create one secure account for your orders, saved bag and delivery details." asideItems={["Saved bag across devices", "Order and return tracking", "Faster secure checkout"]} icon={FiUserPlus}>
    <form onSubmit={submit} className="mt-7">
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-slate-700">Full name<input type="text" name="name" value={form.name} onChange={change} autoComplete="name" minLength="2" maxLength="80" className="field-control mt-2" required /></label>
        <label className="block text-sm font-semibold text-slate-700">Email address<input type="email" name="email" value={form.email} onChange={change} autoComplete="email" className="field-control mt-2" required /></label>
        <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={change} autoComplete="new-password" minLength="8" maxLength="128" className="field-control pr-12" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div><span className="mt-2 block text-xs font-normal text-slate-500">At least 8 characters with a letter and a number.</span></label>
        <label className="block text-sm font-semibold text-slate-700">Confirm password<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} autoComplete="new-password" minLength="8" maxLength="128" className="field-control mt-2" required /></label>
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm"><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={change} className="mt-1 h-4 w-4" required/><span>I accept the <Link to="/terms-conditions" target="_blank" className="font-semibold text-brand-primary underline">Terms</Link> and <Link to="/privacy-policy" target="_blank" className="font-semibold text-brand-primary underline">Privacy Policy</Link>.</span></label>
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"><input type="checkbox" name="marketingConsent" checked={form.marketingConsent} onChange={change} className="mt-1 h-4 w-4"/><span><strong className="block text-slate-800">Helpful shopping emails</strong><span className="mt-1 block leading-5 text-slate-500">Optional saved-bag reminders and store updates.</span></span></label>
      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-4 disabled:opacity-60">{loading ? "Creating account…" : "Create secure account"}</button>
    </form>
    <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-brand-primary hover:underline">Sign in</Link></p>
  </AuthShell>;
}
