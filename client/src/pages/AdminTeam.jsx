import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCheck, FiClock, FiExternalLink, FiMail, FiShield, FiUserPlus, FiX } from "react-icons/fi";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

const businessTypeLabel = (value = "") => value
  .split("_")
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const formatAddress = (address) => [
  address?.line1,
  address?.line2,
  address?.city,
  address?.state,
  address?.pincode,
].filter(Boolean).join(", ");

function ProfileField({ label, children, className = "" }) {
  return <div className={className}>
    <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
    <div className="mt-1 font-semibold text-slate-800">{children || "Not provided"}</div>
  </div>;
}

function AdminTeam() {
  const [data, setData] = useState({ sellers: [], invitations: [] });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/seller-team`); setData(response.data); } catch (error) { toast.error(error.response?.data?.message || "Seller accounts could not be loaded"); } finally { setLoading(false); } };
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/auth/seller-team`).then(({ data: response }) => { if (active) setData(response); }).catch((error) => { if (active) toast.error(error.response?.data?.message || "Seller team could not be loaded"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const invite = async (event) => { event.preventDefault(); setBusy(true); try { const { data: result } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/seller-invitations`, { email: email.trim() }); toast.success(result.message); setEmail(""); await load(); } catch (error) { toast.error(error.response?.data?.message || "Invitation could not be sent"); } finally { setBusy(false); } };
  const review = async (seller, status) => { const note = window.prompt(status === "verified" ? "Optional approval note:" : "Explain what must be corrected:", ""); if (note === null) return; if (status === "rejected" && note.trim().length < 5) return toast.error("Add a clear correction note"); const checksConfirmed = status === "verified" ? window.confirm("Confirm that you checked the GSTIN on the official GST Portal, its status is Active, the legal details match, and bank ownership proof matches the applicant.") : true; if (!checksConfirmed || !window.confirm(`${status === "verified" ? "Approve" : "Reject"} ${seller.email}?`)) return; try { const { data: result } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/auth/seller-team/${seller._id}/verification`, { status, note, gstVerified: status === "verified", bankVerified: status === "verified" }); toast.success(result.message); await load(); } catch (error) { toast.error(error.response?.data?.message || "Verification could not be updated"); } };

  return <SellerPage><SellerHeader title="Seller team" description="Invite authorised sellers and review business, GST and settlement details." />
    <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-brand-primary"><FiUserPlus/></span><div><h2 className="font-semibold">Invite a seller</h2><p className="mt-1 text-sm text-slate-500">A private registration link valid for 48 hours will be emailed to them.</p></div></div><form onSubmit={invite} className="mt-5 flex flex-col gap-3 sm:flex-row"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-control flex-1" placeholder="seller@example.com"/><button disabled={busy} className="btn-primary sm:min-w-48"><FiMail/> {busy ? "Sending…" : "Send invitation"}</button></form>
      {data.invitations?.length > 0 && <div className="mt-5 border-t pt-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pending invitations</p><div className="mt-3 grid gap-2 md:grid-cols-2">{data.invitations.map((invite) => <div key={invite._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="truncate font-medium">{invite.email}</span><span className="ml-3 shrink-0 text-xs text-slate-400">Expires {new Date(invite.expiresAt).toLocaleString("en-IN")}</span></div>)}</div></div>}
    </section>
    <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-5 md:px-6"><h2 className="font-semibold">Independent seller accounts</h2><p className="mt-1 text-sm text-slate-500">Each verified seller receives an isolated catalogue, order view and business profile. They never receive platform-administrator access.</p></div>{!loading && !data.sellers?.length ? <SellerEmpty title="No seller accounts" description="Send the first secure invitation above."/> : <div className="divide-y">{data.sellers?.map((seller) => <article key={seller._id} className="p-5 md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{seller.name}</h3><StatusBadge value={seller.profile?.verificationStatus || (seller.accountType === "seller" ? "Pending" : "Owner")}/></div><p className="mt-1 text-sm text-slate-500">{seller.email} · {seller.accountType === "seller" || seller.sellerRole === "member" ? "Independent marketplace seller" : "Platform administrator"}</p></div>{seller.profile?.verificationStatus === "pending" && <div className="flex gap-2"><button onClick={() => review(seller, "rejected")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"><FiX/> Reject</button><button onClick={() => review(seller, "verified")} className="btn-primary"><FiCheck/> Verify</button></div>}</div>
          {seller.profile ? <div className="mt-5 space-y-4">
            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
              <ProfileField label="Legal business">{seller.profile.legalBusinessName}</ProfileField>
              <ProfileField label="Trade name">{seller.profile.tradeName}</ProfileField>
              <ProfileField label="Constitution">{businessTypeLabel(seller.profile.businessType)}</ProfileField>
              <ProfileField label="Authorised signatory">{seller.profile.authorizedSignatoryName}</ProfileField>
              <ProfileField label="Business phone">{seller.profile.businessPhone}</ProfileField>
              <ProfileField label="Submitted">{seller.profile.submittedAt ? new Date(seller.profile.submittedAt).toLocaleString("en-IN") : "Not recorded"}</ProfileField>
              <ProfileField label="Registered business address" className="md:col-span-2 xl:col-span-3">{formatAddress(seller.profile.registeredAddress)}</ProfileField>
              <ProfileField label="Pickup address" className="md:col-span-2 xl:col-span-3">{formatAddress(seller.profile.pickupAddress)}</ProfileField>
            </div>
            <div className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
              <ProfileField label="GSTIN"><span className="font-mono">{seller.profile.gstin}</span> <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noreferrer" className="ml-1 inline-flex text-brand-primary" aria-label="Verify GSTIN on official GST portal"><FiExternalLink/></a></ProfileField>
              <ProfileField label="PAN"><span className="font-mono">{seller.profile.pan}</span></ProfileField>
              <ProfileField label="GST check"><StatusBadge value={seller.profile.gstVerification?.status || "pending"}/></ProfileField>
              <ProfileField label="Settlement account holder">{seller.profile.bankAccountHolder}</ProfileField>
              <ProfileField label="Account type">{businessTypeLabel(seller.profile.bankAccountType)}</ProfileField>
              <ProfileField label="Bank check"><StatusBadge value={seller.profile.bankVerification?.status || "pending"}/></ProfileField>
              <details className="rounded-xl border border-amber-200 bg-white p-3 md:col-span-2"><summary className="cursor-pointer text-xs font-semibold text-brand-primary">Show encrypted settlement account for verification</summary><p className="mt-2 font-mono font-semibold">{seller.profile.bankAccountNumber}</p></details>
              <ProfileField label="IFSC"><span className="font-mono">{seller.profile.ifsc}</span></ProfileField>
              {seller.profile.reviewNote && <ProfileField label="Review note" className="md:col-span-2 xl:col-span-3">{seller.profile.reviewNote}</ProfileField>}
            </div>
          </div> : <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><FiShield/> Platform administrator and catalogue owner</div>}
        </article>)}</div>}</section>
    <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><FiClock className="mt-0.5 shrink-0"/>Format checks do not prove registration or bank ownership. Approve only after comparing official GST registration and bank proof. Bank data is encrypted at rest and shown only on this owner page.</p>
  </SellerPage>;
}

export default AdminTeam;
