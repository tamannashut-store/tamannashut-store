import { useEffect, useState } from "react";
import axios from "axios";

async function browserVisitorId() {
  const key = "product_presence_browser";
  const readOrCreate = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved?.id && Date.now() - saved.createdAt < 86_400_000) return saved.id;
    const id = crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ id, createdAt: Date.now() }));
    return id;
  } catch {
    // Without shared storage, omit the badge rather than double-count tabs.
    return null;
  }
  };
  // Serialize first-use/rotation across tabs so simultaneous opens count once.
  if (!navigator.locks) return null;
  return navigator.locks.request(key, readOrCreate);
}

export default function ProductActivity({ productId }) {
  const [others, setOthers] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const heartbeat = async () => {
      if (document.visibilityState !== "visible") { setOthers(0); return; }
      if (pending) return;
      pending = true;
      try {
        const visitorId = await browserVisitorId();
        if (controller.signal.aborted) return;
        if (!visitorId) { setOthers(0); return; }
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${productId}/presence`, { visitorId }, { signal: controller.signal, timeout: 8000 });
        if (!controller.signal.aborted) setOthers(Number.isSafeInteger(data.otherViewers) && data.otherViewers > 0 ? data.otherViewers : 0);
      } catch {
        if (!controller.signal.aborted) setOthers(0);
      } finally { pending = false; }
    };
    heartbeat();
    const interval = setInterval(heartbeat, 30_000);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, [productId]);

  if (!others) return null;
  return <p className="mt-3 flex items-center gap-2 text-sm text-gray-600" title="Other browsers active on this product within the last 90 seconds. Multiple tabs in the same browser count once.">
    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
    {others} other {others === 1 ? "shopper" : "shoppers"} viewing this product
  </p>;
}
