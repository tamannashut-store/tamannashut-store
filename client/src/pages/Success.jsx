import { FiCheck, FiCreditCard, FiPackage } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

function readConfirmation(state) {
  if (state?.paymentMethod) return state;
  try {
    const stored = JSON.parse(sessionStorage.getItem("last_order_confirmation") || "null");
    if (stored?.paymentMethod && Date.now() - Number(stored.createdAt || 0) < 30 * 60 * 1000) return stored;
  } catch { sessionStorage.removeItem("last_order_confirmation"); }
  return null;
}

function Success() {
  const { state } = useLocation();
  const confirmation = readConfirmation(state);
  const isPaid = confirmation?.paymentMethod === "Online";

  return <main className="grid min-h-[68vh] place-items-center bg-brand-background px-5 py-14 sm:px-6">
    <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-12">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${confirmation ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><FiCheck size={32}/></span>
      <p className="eyebrow mt-6">{confirmation ? "Order confirmed" : "Confirmation unavailable"}</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-950 sm:text-5xl">{confirmation ? (isPaid ? "Payment successful" : "Your order is placed") : "Open your orders to confirm status"}</h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">{confirmation ? (isPaid ? "Your online payment was verified and your order is now being prepared." : "You selected cash on delivery. No payment has been collected yet; pay when the order reaches you.") : "This page does not contain a recent checkout confirmation. Your order history is the reliable place to check an order."}</p>
      {confirmation && <div className="mt-7 rounded-2xl bg-slate-50 p-4 text-left"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-primary">{isPaid ? <FiCreditCard/> : <FiPackage/>}</span><div><p className="text-xs uppercase tracking-wide text-slate-500">Payment</p><p className="font-semibold">{isPaid ? "Paid online" : "Cash on delivery · Payment pending"}</p></div></div>{confirmation.orderId && <p className="mt-3 border-t pt-3 font-mono text-xs text-slate-500">Order #{String(confirmation.orderId).slice(-8).toUpperCase()}</p>}</div>}
      <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link to="/my-orders" className="btn-primary">View my orders</Link><Link to="/shop" className="btn-secondary">Continue shopping</Link></div>
    </section>
  </main>;
}

export default Success;
