import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export default function SellerBankProofNotice() {
  const [missing, setMissing] = useState(false);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    const check = () => axios.get(`${import.meta.env.VITE_API_URL}/api/auth/seller-profile/me`)
      .then(({ data }) => { if (active) setMissing(!data.profile?.bankProof?.digest); })
      .catch(() => {});
    check(); window.addEventListener("focus", check);
    return () => { active = false; window.removeEventListener("focus", check); };
  }, [location.pathname]);
  if (!missing) return null;
  return <div role="alert" className="mx-4 mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:mx-8">
    <strong className="block text-lg">Action required: upload bank proof now</strong>
    <p className="mt-2 text-sm leading-6">This applies to existing sellers too. Upload a cancelled cheque, passbook page or bank statement showing your account holder name, account number and IFSC. Selling and payouts are paused until the document is reviewed.</p>
    <Link to="/seller/profile#bank-proof" className="btn-primary mt-4">Upload bank proof now</Link>
  </div>;
}
