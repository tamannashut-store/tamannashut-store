import FileUpload from "./FileUpload";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";

export function BankProofInput({ onChange, required = false }) {
  return <FileUpload label="Bank ownership document" required={required} accept="application/pdf,image/jpeg,image/png" maxSizeMB={3} onChange={onChange} hint="Upload a cancelled cheque, passbook page or bank statement showing the account holder, account number and IFSC. Hide balances and unrelated transactions. PDF, JPG or PNG, up to 3 MB. Visible only to you and the owner administrator." />;
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
