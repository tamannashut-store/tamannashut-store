import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import AuthShell from "../components/AuthShell";
import { readSession } from "../utils/storage";
import { homeForAccount, signInForAccount } from "../utils/accountSession";

export default function ChangePassword() {
  const navigate = useNavigate();
  const session = readSession();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visible, setVisible] = useState({ current: false, next: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => { setError(""); setForm((current) => ({ ...current, [key]: value })); };
  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword) || form.newPassword.length < 8) return setError("Use at least 8 characters with at least one letter and one number.");
    if (form.newPassword !== form.confirmPassword) return setError("The two new passwords do not match.");
    setSubmitting(true);
    try {
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      localStorage.removeItem("user"); delete axios.defaults.headers.common.Authorization;
      navigate(data.loginPath || signInForAccount(session?.user), { replace: true, state: { message: "Password changed. Sign in again with your new password." } });
    } catch (requestError) { setError(requestError.response?.data?.message || "Password could not be changed."); }
    finally { setSubmitting(false); }
  };
  return <AuthShell eyebrow="Account security" title="Change your password" description="This signs out your other sessions so only the new password can access your account." asideTitle="Keep your account protected." asideCopy="Use a unique password that you do not use on other websites." asideItems={["Current password verification", "All older sessions invalidated", "Encrypted password storage"]} icon={FiKey}>
    <form onSubmit={submit} className="mt-7 space-y-5">
      <PasswordField label="Current password" value={form.currentPassword} visible={visible.current} toggle={() => setVisible((v) => ({ ...v, current: !v.current }))} onChange={(v) => change("currentPassword", v)} autoComplete="current-password" />
      <PasswordField label="New password" value={form.newPassword} visible={visible.next} toggle={() => setVisible((v) => ({ ...v, next: !v.next }))} onChange={(v) => change("newPassword", v)} autoComplete="new-password" />
      <label className="block text-sm font-semibold text-slate-700">Confirm new password<input type="password" value={form.confirmPassword} onChange={(event) => change("confirmPassword", event.target.value)} minLength="8" maxLength="128" autoComplete="new-password" className="field-control mt-2" required /></label>
      <p className="text-xs leading-5 text-slate-500">Use 8–128 characters with at least one letter and one number.</p>
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <button disabled={submitting} className="btn-primary w-full py-4 disabled:opacity-60">{submitting ? "Updating password…" : "Update password"}</button>
    </form>
    <p className="mt-7 border-t pt-6 text-center text-sm"><Link to={homeForAccount(session?.user)} className="font-semibold text-brand-primary hover:underline">Cancel and return to account</Link></p>
  </AuthShell>;
}

function PasswordField({ label, value, visible, toggle, onChange, autoComplete }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<div className="relative mt-2"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} minLength="8" maxLength="128" autoComplete={autoComplete} className="field-control pr-12" required/><button type="button" onClick={toggle} aria-label={visible ? `Hide ${label}` : `Show ${label}`} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{visible ? <FiEyeOff/> : <FiEye/>}</button></div></label>;
}
