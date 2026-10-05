import { useState } from "react";
import axios from "axios";

export default function AdminRefundDetails({ order }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const act = async (remind = false) => {
    setBusy(true); setMessage("");
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/orders/refund-details/${order._id}/${remind ? "remind" : "admin"}`;
      const response = remind ? await axios.post(url) : await axios.get(url);
      if (remind) setMessage(response.data.message); else setData(response.data);
    } catch (error) { setMessage(error.response?.data?.message || "Refund details could not be loaded"); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-amber-200 bg-white p-4" aria-label="Customer refund destination">
    <p className="font-semibold">Customer refund destination</p>
    <p className="mt-2 text-xs text-slate-600">{order.status === "Refunded" ? "This refund is completed. Customer details are available for your payment records." : order.email ? "The customer receives an email and an account notification to provide details." : "The customer receives an account notification to provide details. This order has no email address."} Verify the recipient before paying.</p>
    {order.refund?.detailsEmailFailed && <p className="mt-2 text-sm text-red-700">Request email delivery failed. The account notification is still available.</p>}
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
    {data?.submitted ? <dl className="mt-3 space-y-2 break-all text-sm">{[["Method", data.details.method], ["Account holder", data.details.holderName], ...(data.details.method === "UPI" ? [["UPI ID", data.details.upiId]] : [["Account number", data.details.accountNumber], ["IFSC", data.details.ifsc]])].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd>{value}</dd></div>)}<p className="text-xs text-slate-500">Recorded {new Date(data.submittedAt).toLocaleString("en-IN")}. Submission does not verify account ownership.</p><button onClick={() => setData(null)} className="btn-secondary w-full">Hide details</button></dl> : <><p className="mt-3 text-sm text-slate-600">{data && !data.submitted ? "Waiting for the customer to submit details." : order.refund?.detailsSubmittedAt ? "Customer details submitted." : "Waiting for customer details."}</p><button disabled={busy} onClick={() => act()} className="btn-secondary mt-3 w-full">{busy ? "Please wait…" : "View customer refund details"}</button>{order.status === "Refund Pending" && !order.refund?.detailsSubmittedAt && order.email && <button disabled={busy} onClick={() => act(true)} className="btn-secondary mt-2 w-full">Retry request email</button>}</>}
  </section>;
}
