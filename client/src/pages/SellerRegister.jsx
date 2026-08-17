import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { FiCheckCircle, FiExternalLink, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import logo from "../assets/logo.png";

const initialForm = {
  name: "", password: "", confirmPassword: "", legalBusinessName: "", tradeName: "", businessType: "",
  businessPhone: "", authorizedSignatoryName: "", gstin: "", pan: "",
  registeredAddressLine1: "", registeredAddressLine2: "", registeredAddressCity: "", registeredAddressState: "", registeredAddressPincode: "",
  pickupSameAsRegistered: true, pickupAddressLine1: "", pickupAddressLine2: "", pickupAddressCity: "", pickupAddressState: "", pickupAddressPincode: "",
  bankAccountHolder: "", bankAccountType: "current", bankAccountNumber: "", confirmBankAccountNumber: "", ifsc: "",
  gstDeclaration: false, bankDeclaration: false, termsAccepted: false,
};

const Field = ({ label, children, wide = false }) => <label className={`field-label ${wide ? "md:col-span-2" : ""}`}>{label}{children}</label>;

function SellerRegister() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/auth/seller-invitations/${token}`)
      .then(({ data }) => { if (active) setInvitation(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "This seller invitation could not be verified"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.bankAccountNumber !== form.confirmBankAccountNumber) return setError("Bank account numbers do not match");
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/seller-invitations/${token}/accept`, form);
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Seller account could not be created");
    } finally { setSubmitting(false); }
  };

  if (!token) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><img src={logo} alt="Tamanna's Hut" className="mx-auto h-16"/><FiLock className="mx-auto mt-7 text-3xl text-brand-primary"/><h1 className="mt-4 text-3xl font-bold">Invitation required</h1><p className="mt-3 leading-7 text-slate-600">Seller registration starts from a private invitation sent by the platform administrator.</p><Link to="/admin-login" className="btn-primary mt-7 w-full">Back to seller sign in</Link></section></main>;
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] text-slate-500">Checking secure invitation…</main>;
  if (complete) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><FiCheckCircle className="mx-auto text-5xl text-emerald-600"/><h1 className="mt-5 text-3xl font-bold">Application submitted</h1><p className="mt-3 leading-7 text-slate-600">Your seller account is separate from the platform administrator. Access stays locked until GST and settlement details are reviewed.</p><Link to="/admin-login" className="btn-primary mt-7 w-full">Go to seller sign in</Link></section></main>;
  if (!invitation) return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl"><h1 className="text-3xl font-bold">Invitation unavailable</h1><p role="alert" className="mt-4 text-red-700">{error}</p><Link to="/admin-login" className="btn-secondary mt-7 w-full">Back to seller sign in</Link></section></main>;

  return <main className="min-h-screen bg-[#f7f5ef] px-4 py-7 sm:px-8 sm:py-10"><div className="mx-auto max-w-5xl">
    <header className="mb-7 flex items-center justify-between gap-4"><img src={logo} alt="Tamanna's Hut" className="h-14 rounded-xl bg-white px-2 py-1 shadow-sm sm:h-16"/><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:px-4 sm:text-sm"><FiShield/> Secure onboarding</span></header>
    <form onSubmit={submit} className="overflow-hidden rounded-3xl border bg-white shadow-[0_24px_70px_rgba(20,45,32,.12)]">
      <div className="bg-[#123b29] px-5 py-7 text-white sm:px-10 sm:py-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Marketplace seller</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Create your independent seller account</h1><p className="mt-3 text-white/70">Invited email: <strong className="text-white">{invitation.email}</strong></p></div>
      <div className="space-y-9 p-5 sm:p-10">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <section><h2 className="text-xl font-bold">1. Account owner</h2><div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Full name"><input required minLength="2" maxLength="80" autoComplete="name" value={form.name} onChange={(e) => change("name", e.target.value)} className="field-control mt-2"/></Field>
          <Field label="Business phone"><input required inputMode="tel" autoComplete="tel" value={form.businessPhone} onChange={(e) => change("businessPhone", e.target.value)} className="field-control mt-2" placeholder="10-digit mobile number"/></Field>
          <Field label="Password"><div className="relative mt-2"><input required minLength="8" maxLength="128" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => change("password", e.target.value)} className="field-control pr-12"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></Field>
          <Field label="Confirm password"><input required minLength="8" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => change("confirmPassword", e.target.value)} className="field-control mt-2"/></Field>
        </div></section>

        <section className="border-t pt-8"><h2 className="text-xl font-bold">2. Legal business and GST</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter the names exactly as shown on the GST registration certificate.</p><div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Legal business name"><input required maxLength="120" value={form.legalBusinessName} onChange={(e) => change("legalBusinessName", e.target.value)} className="field-control mt-2"/></Field>
          <Field label="Trade / storefront name"><input required maxLength="120" value={form.tradeName} onChange={(e) => change("tradeName", e.target.value)} className="field-control mt-2"/></Field>
          <Field label="Business constitution"><select required value={form.businessType} onChange={(e) => change("businessType", e.target.value)} className="field-control mt-2"><option value="">Select type</option><option value="proprietorship">Proprietorship</option><option value="partnership">Partnership</option><option value="llp">LLP</option><option value="private_limited">Private limited company</option><option value="public_limited">Public limited company</option><option value="trust">Trust</option><option value="society">Society</option><option value="other">Other</option></select></Field>
          <Field label="Authorised signatory"><input required maxLength="120" value={form.authorizedSignatoryName} onChange={(e) => change("authorizedSignatoryName", e.target.value)} className="field-control mt-2"/></Field>
          <Field label="GSTIN"><input required minLength="15" maxLength="15" value={form.gstin} onChange={(e) => change("gstin", e.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="19ABCDE1234F1Z5"/></Field>
          <Field label="PAN"><input required minLength="10" maxLength="10" value={form.pan} onChange={(e) => change("pan", e.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="ABCDE1234F"/></Field>
        </div><a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">Check GSTIN on the official GST Portal <FiExternalLink/></a></section>

        <section className="border-t pt-8"><h2 className="text-xl font-bold">3. Registered and pickup address</h2><div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Registered address" wide><input required minLength="5" value={form.registeredAddressLine1} onChange={(e) => change("registeredAddressLine1", e.target.value)} className="field-control mt-2" placeholder="Building, street, locality"/></Field>
          <Field label="Address line 2" wide><input value={form.registeredAddressLine2} onChange={(e) => change("registeredAddressLine2", e.target.value)} className="field-control mt-2" placeholder="Landmark (optional)"/></Field>
          <Field label="City"><input required value={form.registeredAddressCity} onChange={(e) => change("registeredAddressCity", e.target.value)} className="field-control mt-2"/></Field><Field label="State"><input required value={form.registeredAddressState} onChange={(e) => change("registeredAddressState", e.target.value)} className="field-control mt-2"/></Field><Field label="Pincode"><input required inputMode="numeric" minLength="6" maxLength="6" value={form.registeredAddressPincode} onChange={(e) => change("registeredAddressPincode", e.target.value.replace(/\D/g, ""))} className="field-control mt-2"/></Field>
        </div><label className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm"><input type="checkbox" checked={form.pickupSameAsRegistered} onChange={(e) => change("pickupSameAsRegistered", e.target.checked)} className="mt-1"/><span><strong>Pickup address is the same</strong><span className="mt-1 block text-slate-500">Shipments will be collected from this location.</span></span></label>
        {!form.pickupSameAsRegistered && <div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Pickup address" wide><input required minLength="5" value={form.pickupAddressLine1} onChange={(e) => change("pickupAddressLine1", e.target.value)} className="field-control mt-2"/></Field><Field label="Pickup address line 2" wide><input value={form.pickupAddressLine2} onChange={(e) => change("pickupAddressLine2", e.target.value)} className="field-control mt-2"/></Field><Field label="Pickup city"><input required value={form.pickupAddressCity} onChange={(e) => change("pickupAddressCity", e.target.value)} className="field-control mt-2"/></Field><Field label="Pickup state"><input required value={form.pickupAddressState} onChange={(e) => change("pickupAddressState", e.target.value)} className="field-control mt-2"/></Field><Field label="Pickup pincode"><input required inputMode="numeric" minLength="6" maxLength="6" value={form.pickupAddressPincode} onChange={(e) => change("pickupAddressPincode", e.target.value.replace(/\D/g, ""))} className="field-control mt-2"/></Field></div>}</section>

        <section className="border-t pt-8"><h2 className="text-xl font-bold">4. Settlement bank account</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use an account belonging to the registered business or proprietor. Details are encrypted at rest.</p><div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Account holder name" wide><input required maxLength="120" value={form.bankAccountHolder} onChange={(e) => change("bankAccountHolder", e.target.value)} className="field-control mt-2"/></Field>
          <Field label="Account type"><select required value={form.bankAccountType} onChange={(e) => change("bankAccountType", e.target.value)} className="field-control mt-2"><option value="current">Current</option><option value="savings">Savings</option></select></Field>
          <Field label="IFSC code"><input required minLength="11" maxLength="11" value={form.ifsc} onChange={(e) => change("ifsc", e.target.value.toUpperCase())} className="field-control mt-2 uppercase" placeholder="ABCD0123456"/></Field>
          <Field label="Account number"><input required inputMode="numeric" minLength="6" maxLength="20" autoComplete="off" value={form.bankAccountNumber} onChange={(e) => change("bankAccountNumber", e.target.value.replace(/\D/g, ""))} className="field-control mt-2"/></Field>
          <Field label="Confirm account number"><input required inputMode="numeric" minLength="6" maxLength="20" autoComplete="off" value={form.confirmBankAccountNumber} onChange={(e) => change("confirmBankAccountNumber", e.target.value.replace(/\D/g, ""))} className="field-control mt-2"/></Field>
        </div></section>

        <section className="border-t pt-8"><h2 className="text-xl font-bold">5. Declarations</h2><div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 rounded-xl border p-4 text-sm leading-6"><input required type="checkbox" checked={form.gstDeclaration} onChange={(e) => change("gstDeclaration", e.target.checked)} className="mt-1"/><span>I checked the GSTIN on the official GST Portal; it is active and its legal name, PAN and address match this application.</span></label>
          <label className="flex items-start gap-3 rounded-xl border p-4 text-sm leading-6"><input required type="checkbox" checked={form.bankDeclaration} onChange={(e) => change("bankDeclaration", e.target.checked)} className="mt-1"/><span>The settlement bank account belongs to this business or proprietor, and I can provide proof during review.</span></label>
          <label className="flex items-start gap-3 rounded-xl border p-4 text-sm leading-6"><input required type="checkbox" checked={form.termsAccepted} onChange={(e) => change("termsAccepted", e.target.checked)} className="mt-1"/><span>I accept the seller terms and consent to secure processing of GST, PAN and bank details for verification and settlement.</span></label>
        </div></section>
        <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Verification note:</strong> format validation cannot prove that a GST registration is active or that a bank account is owned by the applicant. Access remains pending until the platform administrator completes official/manual checks.</div>
        <button disabled={submitting} className="btn-primary w-full py-4 text-base disabled:opacity-60">{submitting ? "Submitting securely…" : "Submit seller application"}</button>
      </div>
    </form>
  </div></main>;
}

export default SellerRegister;
