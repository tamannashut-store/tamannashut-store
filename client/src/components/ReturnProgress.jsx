import { Link } from "react-router-dom";

const stages = ["Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending", "Refunded"];
const messages = {
  "Return Requested": "Your request is being reviewed. Keep the item and its original packaging ready; wait for approval before sending it back.",
  "Return Approved": "Your return is approved. Pickup instructions and tracking will appear here when arranged.",
  "Return Picked Up": "The courier has collected your return. Your refund is reviewed after the item reaches us and is inspected.",
  Returned: "Your return has been received. We will update this order after inspection and refund review.",
};

export default function ReturnProgress({ order }) {
  const stage = stages.indexOf(order.status);
  if (stage < 0) return null;
  const isReturn = Boolean(order.returnRequest?.reason) || stage < 4;
  const awb = order.returnRequest?.reverseAwb;
  return <section aria-label="Return and refund progress" className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
    <h3 className="font-semibold">{isReturn ? "Return and refund progress" : "Refund progress"}</h3>
    {isReturn && <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{stages.map((label, index) => <li key={label} aria-current={index === stage ? "step" : undefined} className={`rounded-xl px-3 py-2 text-xs ${index <= stage ? "bg-emerald-100 font-semibold text-emerald-900" : "bg-white text-slate-500"}`}><span className="mr-2">{index < stage ? "✓" : index + 1}</span>{label}</li>)}</ol>}
    <p className="mt-3 text-sm leading-6 text-slate-600">{messages[order.status] || (order.status === "Refunded" ? "Your refund is completed. The payment method and reference are shown in your refund summary when available." : order.paymentMethod === "COD" ? "Your COD refund is pending. Provide UPI or bank details securely below if requested. Payment is confirmed here once completed." : "Your refund goes to the original online payment method. You do not need to provide UPI or bank details. Payment providers may take additional time to credit it.")}</p>
    {awb && isReturn && <div className="mt-4 rounded-xl border bg-white p-3 text-sm"><p className="font-semibold">Return courier: {order.returnRequest.reverseCourierName || "Assigned courier"}</p><p className="mt-1 break-all text-slate-600">Return tracking number: {awb}</p>{order.status === "Return Approved" && <p className="mt-1 text-slate-600">{order.returnRequest.reversePickupScheduled ? "Return pickup scheduled" : "Awaiting pickup scheduling"}</p>}<a href={`https://www.shiprocket.in/shipment-tracking/?tracking_id=${encodeURIComponent(awb)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-brand-primary underline">Track return package</a></div>}
    <Link to="/return-policy" className="mt-3 inline-block text-sm font-semibold text-brand-primary underline">Return and refund policy</Link>
  </section>;
}
