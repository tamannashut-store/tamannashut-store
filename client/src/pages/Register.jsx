import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";

const readGuestCart = () => { try { const value = JSON.parse(localStorage.getItem("guest_cart")); return Array.isArray(value) ? value : []; } catch { return []; } };

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", marketingConsent: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setError("");
    setFormData((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, { ...formData, name: formData.name.trim(), email: formData.email.trim() });
      const guestCart = readGuestCart();
      localStorage.setItem("user", JSON.stringify(data));
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      if (guestCart.length) {
        try { await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, { items: guestCart.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })) }); }
        catch { toast.error("Account created, but your bag could not sync. Please review it before checkout."); }
      }
      localStorage.removeItem("guest_cart");
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Account created");
      const destination = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(destination || (guestCart.length ? "/checkout" : "/profile"), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Your account could not be created. Please try again.");
    } finally { setLoading(false); }
  };

  return <AuthShell eyebrow="Create customer account" title="Join Tamanna's Hut" description="Save your bag, track orders and check out faster on every device." asideTitle="Everything for easier shopping." asideCopy="Create one secure account for your orders, saved bag and delivery details." asideItems={["Saved bag across devices", "Order and return tracking", "Faster secure checkout"]} icon={FiUserPlus}>
    <form onSubmit={handleSubmit} className="mt-7"><div className="space-y-5"><label className="block text-sm font-semibold text-slate-700">Full name<input type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="name" placeholder="Your name" minLength="2" maxLength="80" className="field-control mt-2" required /></label><label className="block text-sm font-semibold text-slate-700">Email address<input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" placeholder="you@example.com" className="field-control mt-2" required /></label><label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" placeholder="At least 8 characters" minLength="8" maxLength="128" className="field-control pr-12" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"><input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={handleChange} className="mt-1 h-4 w-4" /><span><strong className="block text-slate-800">Helpful shopping emails</strong><span className="mt-1 block leading-5 text-slate-500">Optional saved-bag reminders and store updates. Order and account emails are always sent when needed.</span></span></label>{error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}<button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-4 disabled:cursor-wait disabled:opacity-60">{loading ? "Creating account…" : "Create secure account"}</button></form>
    <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-brand-primary hover:underline">Sign in</Link></p>
  </AuthShell>;
}

export default Register;
