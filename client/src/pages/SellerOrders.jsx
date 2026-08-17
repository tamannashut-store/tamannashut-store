import { useEffect, useState } from "react";
import axios from "axios";
import { SellerEmpty, SellerHeader, SellerPage, StatusBadge } from "../components/SellerUI";

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/orders/seller/mine`).then(({ data }) => { if (active) setOrders(data.orders || []); }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Orders could not be loaded"); }); return () => { active = false; }; }, []);
  return <SellerPage><SellerHeader eyebrow="My fulfilment" title="Seller orders" description="Each card contains only line items owned by your seller account. Platform-wide customer and seller data is never included."/>
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    {!error && orders.length === 0 ? <SellerEmpty title="No seller orders yet" description="New orders containing one of your approved listings will appear here."/> : <div className="space-y-4">{orders.map((order) => <article key={order._id} className="overflow-hidden rounded-2xl border bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4"><div><p className="font-mono text-xs text-slate-500">ORDER #{String(order._id).slice(-8).toUpperCase()}</p><p className="mt-1 text-sm">{new Date(order.createdAt).toLocaleString("en-IN")}</p></div><div className="flex items-center gap-3"><StatusBadge value={order.status}/><strong>₹{Number(order.sellerTotal || 0).toLocaleString("en-IN")}</strong></div></header><div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]"><div className="space-y-3">{order.products.map((item) => <div key={`${item._id}-${item.sku || item.selectedSize}`} className="flex gap-3 rounded-xl border p-3"><img src={item.image || "/placeholder.png"} alt="" className="h-20 w-16 rounded-lg object-cover"/><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.selectedColor || ""} · Size {item.selectedSize} · Qty {item.qty}</p><p className="mt-2 font-semibold">₹{Number(item.lineTotal || 0).toLocaleString("en-IN")}</p></div></div>)}</div><aside className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">Delivery area</p><p className="mt-2 leading-6 text-slate-600">{order.city}, {order.state}<br/>{order.pincode}</p><p className="mt-4 text-xs leading-5 text-slate-500">Shipping and refunds remain controlled by the platform until per-seller shipment and settlement records are enabled.</p></aside></div></article>)}</div>}
  </SellerPage>;
}

export default SellerOrders;
