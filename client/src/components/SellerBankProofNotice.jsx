import { Link } from "react-router-dom";

export default function SellerBankProofNotice({ profile }) {
  if (!profile || profile.bankProof?.digest) return null;
  return <div role="alert" className="mx-4 mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:mx-8">
    <strong className="block text-lg">Action required: upload bank proof now</strong>
    <p className="mt-2 text-sm leading-6">This applies to existing sellers too. Upload a cancelled cheque, passbook page or bank statement showing your account holder name, account number and IFSC. Selling and payouts are paused until the document is reviewed.</p>
    <Link to="/seller/profile#bank-proof" className="btn-primary mt-4">Upload bank proof now</Link>
  </div>;
}
