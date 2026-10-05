import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { readSession } from "../utils/storage";

export default function CustomerNotifications() {
  const [items, setItems] = useState([]);
  const { pathname } = useLocation();
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const session = readSession();
      if (!session || session.user.isAdmin || (session.user.accountType && session.user.accountType !== "customer")) { if (active) setItems([]); return; }
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/refund-details/notifications`);
        if (active) setItems(readSession()?.token === session.token ? data.notifications || [] : []);
      } catch { /* Keep the last known notification during temporary outages. */ }
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    const events = ["focus", "cartUpdated", "refund-details-updated"];
    events.forEach((event) => window.addEventListener(event, refresh));
    return () => { active = false; clearInterval(timer); events.forEach((event) => window.removeEventListener(event, refresh)); };
  }, [pathname]);
  if (!items.length) return null;
  return <aside aria-label="Account notifications" className="border-b border-amber-200 bg-amber-50 px-4 py-3"><div className="mx-auto max-w-7xl space-y-2"><p className="text-sm font-semibold text-amber-900">Action needed for your refund</p>{items.map((item) => <Link key={item.orderId} to={item.href} className="block text-sm text-amber-900 underline">Order #{item.orderId.slice(-8).toUpperCase()}: {item.message}</Link>)}</div></aside>;
}
