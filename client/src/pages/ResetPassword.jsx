import { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams(); const navigate = useNavigate();
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setSubmitting(true);
    try { const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${encodeURIComponent(token)}`, { password }); toast.success(data.message); navigate("/login", { replace: true }); }
    catch (error) { toast.error(error.response?.data?.message || "Password could not be reset"); }
    finally { setSubmitting(false); }
  };
  return <main className="mx-auto max-w-md px-6 py-20"><form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-8 shadow-2xl sm:p-10"><div><h1 className="text-center text-3xl font-bold">Choose a new password</h1><p className="mt-3 text-center text-sm text-slate-600">Use at least 8 characters.</p></div><input type="password" minLength="8" maxLength="128" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="field-control" required/><input type="password" minLength="8" maxLength="128" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="field-control" required/><button disabled={submitting} className="btn-primary w-full disabled:opacity-60">{submitting ? "Updating…" : "Reset password"}</button><p className="text-center text-sm"><Link to="/login" className="font-semibold text-brand-primary hover:underline">Back to sign in</Link></p></form></main>;
}
