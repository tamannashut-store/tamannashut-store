import { useEffect, useState } from "react";
import { FiCheckCircle, FiUsers } from "react-icons/fi";

export default function StoreTrustStrip() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/store-stats`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!controller.signal.aborted && Number.isSafeInteger(data?.deliveredOrders) && Number.isSafeInteger(data?.customersServed)
          && data.deliveredOrders > 0 && data.customersServed > 0 && data.customersServed <= data.deliveredOrders) setStats(data);
      }).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!stats) return null;
  return <section aria-label="Our delivered orders" className="border-y border-[#dde6d9] bg-[#edf3e9] px-5 py-5 text-[#183d2b]">
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm">
      <p className="flex items-center gap-2"><FiCheckCircle aria-hidden="true" className="shrink-0 text-lg" /><span><strong className="font-bold">{stats.deliveredOrders.toLocaleString("en-IN")}</strong> {stats.deliveredOrders === 1 ? "order delivered" : "orders delivered"}</span></p>
      <p className="flex items-center gap-2"><FiUsers aria-hidden="true" className="shrink-0 text-lg" /><span><strong className="font-bold">{stats.customersServed.toLocaleString("en-IN")}</strong> {stats.customersServed === 1 ? "customer served" : "customers served"}</span></p>
      <p className="w-full text-center text-xs text-[#52664b]">Completed purchases on tamannashut.com · Excludes returns and refunds</p>
    </div>
  </section>;
}
