import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiShoppingBag } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";

const readCart = (key) => {
  try {
    const value = JSON.parse(key ? sessionStorage.getItem(key) : localStorage.getItem("guest_cart"));
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setError("");
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email: formData.email.trim(),
        password: formData.password,
      });

      localStorage.setItem("user", JSON.stringify(data));
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      const pendingCart = readCart("pending_guest_cart");
      const guestCart = pendingCart.length ? pendingCart : readCart();
      if (guestCart.length) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, {
            items: guestCart.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })),
          });
        } catch {
          toast.error("Signed in, but your bag could not sync. Please review it before checkout.");
        }
      }

      localStorage.removeItem("guest_cart");
      sessionStorage.removeItem("pending_guest_cart");
      window.dispatchEvent(new Event("cartUpdated"));
      const destination = sessionStorage.getItem("redirectAfterLogin") || "/";
      sessionStorage.removeItem("redirectAfterLogin");
      toast.success("Welcome back");
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Sign in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell eyebrow="Customer account" title="Welcome back" description="Sign in to view orders, manage your profile and continue checkout." asideTitle="Continue your shopping journey." asideCopy="Access saved bags, order tracking, returns and a faster checkout experience." asideItems={["Your bag follows you across devices", "Track every order in one place", "Secure account access"]} icon={FiShoppingBag}>
        <form onSubmit={handleSubmit}>

          {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}{error.includes("Seller Centre") && <Link to="/admin-login" className="mt-2 flex items-center gap-2 font-semibold underline">Open Seller Centre <FiArrowRight /></Link>}{error.toLowerCase().includes("verify your email") && <Link to={`/verify-email?email=${encodeURIComponent(formData.email.trim())}`} className="mt-2 flex items-center gap-2 font-semibold underline">Resend verification email <FiArrowRight /></Link>}</div>}

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Email address<input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" placeholder="you@example.com" required className="field-control mt-2" /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} autoComplete="current-password" placeholder="Enter your password" required className="field-control pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
          </div>

          <div className="mt-4 text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand-primary hover:underline">Forgot password?</Link></div>
          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-4 text-base disabled:cursor-wait disabled:opacity-60"><FiLock className="mr-2" />{loading ? "Signing in…" : "Sign in securely"}</button>
          <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">New to Tamanna&apos;s Hut? <Link to="/register" className="font-semibold text-brand-primary hover:underline">Create an account</Link></p>
        </form>
  </AuthShell>;
}

export default Login;
