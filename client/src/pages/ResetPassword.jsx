import { useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle, FiEye, FiEyeOff, FiKey, FiLock } from "react-icons/fi";
import AuthShell from "../components/AuthShell";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters for your new password.");
    if (password !== confirmPassword) return setError("The two passwords do not match.");
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${encodeURIComponent(token)}`, { password });
      setCompleted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Password could not be reset. Request a new secure link.");
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthShell
    eyebrow="Create new password"
    title={completed ? "Password updated" : "Choose a new password"}
    description={completed ? "Your old sessions have been closed to protect your account." : "Choose a password with at least 8 characters that you do not use elsewhere."}
    asideTitle="Protect every order and saved detail."
    asideCopy="Changing your password signs out older sessions automatically."
    asideItems={["Single-use secure reset link", "Old sessions are invalidated", "Password is stored securely"]}
    icon={completed ? FiCheckCircle : FiKey}
  >
    {completed ? <div className="mt-7">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
        <p className="font-semibold">Your new password is ready</p>
        <p className="mt-1">Sign in again on this and any other device using the new password.</p>
      </div>
      <Link to="/login" className="btn-primary mt-6 w-full py-4">Continue to sign in</Link>
    </div> : <form onSubmit={submit} className="mt-7">
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-slate-700">New password
          <div className="relative mt-2">
            <input aria-label="New password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} minLength="8" maxLength="128" autoComplete="new-password" placeholder="At least 8 characters" className="field-control pr-12" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide new password" : "Show new password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
          </div>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Confirm new password
          <div className="relative mt-2">
            <input aria-label="Confirm new password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} minLength="8" maxLength="128" autoComplete="new-password" placeholder="Enter it again" className="field-control pr-12" required />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Hide confirmed password" : "Show confirmed password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showConfirm ? <FiEyeOff /> : <FiEye />}</button>
          </div>
        </label>
      </div>
      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
        {error}
        {error.toLowerCase().includes("expired") && <Link to="/forgot-password" className="mt-2 block font-semibold underline">Request a new reset link</Link>}
      </div>}
      <button disabled={submitting} className="btn-primary mt-6 w-full py-4 disabled:cursor-wait disabled:opacity-60"><FiLock className="mr-2" />{submitting ? "Updating password…" : "Set new password"}</button>
    </form>}
  </AuthShell>;
}
