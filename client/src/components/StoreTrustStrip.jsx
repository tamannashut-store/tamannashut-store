import { useEffect, useState } from "react";
import { FiCheckCircle, FiUsers, FiShoppingBag } from "react-icons/fi";

export default function StoreTrustStrip() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/store-stats`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!controller.signal.aborted && data) setStats(data);
      }).catch(() => {});
    return () => controller.abort();
  }, []);
  const metrics = stats ? [
    { count: stats.deliveredOrders, label: stats.deliveredOrders === 1 ? "order delivered" : "orders delivered", Icon: FiCheckCircle },
    { count: stats.registeredCustomers, label: stats.registeredCustomers === 1 ? "registered customer" : "registered customers", Icon: FiUsers },
    { count: stats.activeBags, label: stats.activeBags === 1 ? "active shopping bag" : "active shopping bags", Icon: FiShoppingBag },
  ].filter(({ count }) => Number.isSafeInteger(count) && count > 0) : [];
  if (!metrics.length) return null;
  return <section aria-label="Our delivered orders" className="px-5 text-[#183d2b] md:px-8">
    <div className="mx-auto max-w-[1280px] border-b border-slate-200 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm">
        {metrics.map(({ count, label, Icon }) => <p key={label} className="flex items-center gap-2"><Icon aria-hidden="true" className="shrink-0 text-base text-brand-primary" /><span><strong className="font-semibold">{count.toLocaleString("en-IN")}</strong> {label}</span></p>)}
        <details className="w-full text-xs text-slate-500 sm:ml-auto sm:w-auto sm:max-w-sm">
          <summary className="w-fit cursor-pointer underline decoration-slate-300 underline-offset-4 hover:text-brand-primary">About these numbers</summary>
          <p className="mt-2 max-w-sm leading-5">Website orders delivered and paid, excluding returns and refunds. Registered customers are customer accounts, excluding sellers and administrators. Active bags contain items and were updated in the past 24 hours; completed checkout clears the bag. Counts refresh every five minutes.</p>
        </details>
      </div>
    </div>
  </section>;
}
