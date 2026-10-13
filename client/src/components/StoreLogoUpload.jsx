import FileUpload from "./FileUpload";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
export default function StoreLogoUpload({ logoUrl, onSaved }) {
  const [resetKey, setResetKey] = useState(0);
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const upload = async (event) => {
    event.preventDefault(); if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return toast.error("Choose a JPG, PNG or WebP logo up to 5 MB");
    setBusy(true);
    try { const payload = new FormData(); payload.append("logo", file); await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/seller-profile/me/logo`, payload); setFile(null); setResetKey(key => key + 1); await onSaved(); toast.success("Store logo updated"); }
    catch (error) { toast.error(error.response?.data?.message || "Store logo could not be uploaded"); } finally { setBusy(false); }
  };
  return <section className="mb-5 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Store logo</h2><p className="mt-2 text-sm text-slate-500">Your logo appears on your public shop and the Sold by card. Use a square image with space around the edges.</p><form onSubmit={upload} className="mt-4 flex flex-wrap items-center gap-4">{logoUrl && <img src={logoUrl} alt="Current store logo" className="h-20 w-20 rounded-xl border object-contain p-2" />}<FileUpload label="Upload store logo" accept="image/jpeg,image/png,image/webp" maxSizeMB={5} onChange={setFile} key={resetKey} disabled={busy} preview hint="JPG, PNG or WebP · Up to 5 MB · Square logos work best" /><button disabled={!file || busy} className="btn-primary">{busy ? "Uploading…" : "Save logo"}</button></form></section>;
}
