import { useEffect, useRef, useState } from "react";
import { FiCheckCircle, FiFile, FiUploadCloud } from "react-icons/fi";

export default function FileUpload({ label, hint, accept, maxSizeMB, required = false, disabled = false, onChange, preview = false }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const previewUrl = useRef("");
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const select = (event) => {
    const selected = event.target.files?.[0] || null;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = ""; setImageUrl("");
    if (selected && (selected.size > maxSizeMB * 1024 * 1024 || !accept.split(",").includes(selected.type))) {
      setError(`Choose a supported file up to ${maxSizeMB} MB`); event.target.value = ""; setFile(null); onChange(null); return;
    }
    if (preview && selected?.type.startsWith("image/")) { previewUrl.current = URL.createObjectURL(selected); setImageUrl(previewUrl.current); }
    setError(""); setFile(selected); onChange(selected);
  };
  return <div className="min-w-0 w-full"><label className={`relative flex min-w-0 cursor-pointer flex-col gap-4 rounded-2xl border border-dashed p-4 transition focus-within:ring-2 focus-within:ring-brand-primary sm:flex-row sm:items-center ${file ? "border-emerald-300 bg-emerald-50/40" : "border-slate-300 bg-slate-50 hover:border-brand-primary"} ${disabled ? "opacity-60" : ""}`}>
    <input ref={input} type="file" accept={accept} required={required} disabled={disabled} aria-label={label} onChange={select} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white text-xl text-brand-primary">{imageUrl ? <img src={imageUrl} alt="Selected logo preview" className="h-full w-full object-contain p-1" /> : file ? <FiFile /> : <FiUploadCloud />}</span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-1 block break-all text-sm text-slate-500">{file ? file.name : "Choose a file from your device"}</span>{file && <span className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><FiCheckCircle /> Ready to upload · {(file.size / 1024).toFixed(0)} KB</span>}</span>
    <span className="w-fit shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-primary">{file ? "Change file" : "Browse files"}</span>
  </label>{hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
