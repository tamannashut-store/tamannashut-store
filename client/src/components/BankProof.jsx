import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";

export function BankProofInput({ onChange, required = false }) {
  const [error, setError] = useState("");
  return <label className="field-label block">Bank ownership document
    <input required={required} type="file" accept="application/pdf,image/jpeg,image/png" className="field-control mt-2" onChange={(event) => {
      const file = event.target.files?.[0];
      if (file && (file.size > 3 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type))) {
        setError("Choose a PDF, JPG or PNG up to 3 MB"); event.target.value = ""; onChange(null); return;
      }
      setError(""); onChange(file || null);
    }}/>
    <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Upload a cancelled cheque, passbook page or bank statement showing the account holder, account number and IFSC. Hide balances and unrelated transactions. PDF, JPG or PNG, up to 3 MB. Visible only to you and the owner administrator.</span>
    {error && <span role="alert" className="mt-2 block text-sm text-red-700">{error}</span>}
  </label>;
}

export function BankProofDownload({ path, onOpened }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/${path}`, { responseType: "blob" });
      const extension = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" }[response.data.type] || "bin";
      const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = `bank-proof.${extension}`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000); onOpened?.();
    } catch { toast.error("Bank proof could not be downloaded"); }
    finally { setBusy(false); }
  };
  return <button type="button" disabled={busy} onClick={download} className="btn-secondary mt-3">{busy ? "Opening…" : "Download private bank proof"}</button>;
}
