import { useId, useState } from "react";
import { productOptionUrl } from "../utils/productUrl";

export default function ProductShare({ product, color, size }) {
  const [message, setMessage] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const inputId = useId();
  const url = productOptionUrl(product, window.location.origin, { color, size });
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setManualCopy(false);
      setMessage("Link copied with your selected options");
    } catch {
      setManualCopy(true);
      setMessage("Select and copy the link below");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: product.name, url });
    } catch (error) {
      if (error.name !== "AbortError") await copyLink();
    }
  };
  return <div className="mt-3 text-sm">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {typeof navigator.share === "function" && <button type="button" onClick={share} className="min-h-11 font-medium text-brand-primary underline-offset-4 hover:underline">Share product</button>}
      <button type="button" onClick={copyLink} className="min-h-11 font-medium text-brand-primary underline-offset-4 hover:underline">Copy product link</button>
    </div>
    <p role="status" className="text-xs text-gray-500">{message}</p>
    {manualCopy && <div className="mt-2">
      <label htmlFor={inputId} className="text-xs text-gray-600">Product link</label>
      <input id={inputId} readOnly value={url} onFocus={(event) => event.target.select()} className="mt-1 w-full min-w-0 rounded-lg border p-2 text-xs" />
    </div>}
  </div>;
}
