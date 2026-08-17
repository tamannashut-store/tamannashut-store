import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiShoppingBag } from "react-icons/fi";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

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

  return <main className="bg-[#f7f5ef] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(25,55,37,.12)] lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#123b29] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <img src={logo} alt="Tamanna's Hut" className="relative h-16 w-fit rounded-xl bg-white px-2 py-1" />
        <div className="relative py-16"><p className="text-xs font-bold uppercase tracking-[.24em] text-white/55">Your account</p><h1 className="mt-4 font-serif text-5xl leading-tight">Continue your shopping journey.</h1><p className="mt-5 max-w-sm leading-7 text-white/65">Access saved bags, order tracking, returns and a faster checkout experience.</p><ul className="mt-8 space-y-3 text-sm text-white/75"><li className="flex items-center gap-3"><FiCheck /> Your bag follows you across devices</li><li className="flex items-center gap-3"><FiCheck /> Track every order in one place</li><li className="flex items-center gap-3"><FiCheck /> Secure account access</li></ul></div>
        <p className="relative text-xs text-white/40">Comfort-first kidswear, thoughtfully delivered.</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10 lg:p-14">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><img src={logo} alt="Tamanna's Hut" className="h-16 rounded-xl bg-white px-2 py-1 shadow-sm" /></div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef5f0] text-xl text-brand-primary"><FiShoppingBag /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#397153]">Customer account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to view orders, manage your profile and continue checkout.</p>

          {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}{error.includes("Seller Centre") && <Link to="/admin-login" className="mt-2 flex items-center gap-2 font-semibold underline">Open Seller Centre <FiArrowRight /></Link>}</div>}

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Email address<input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" placeholder="you@example.com" required className="field-control mt-2" /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} autoComplete="current-password" placeholder="Enter your password" required className="field-control pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
          </div>

          <div className="mt-4 text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand-primary hover:underline">Forgot password?</Link></div>
          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-4 text-base disabled:cursor-wait disabled:opacity-60"><FiLock className="mr-2" />{loading ? "Signing in…" : "Sign in securely"}</button>
          <p className="mt-7 border-t pt-6 text-center text-sm text-slate-600">New to Tamanna&apos;s Hut? <Link to="/register" className="font-semibold text-brand-primary hover:underline">Create an account</Link></p>
        </form>
      </section>
    </div>
  </main>;
}

export default Login;
