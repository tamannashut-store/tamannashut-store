import { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiMail, FiRefreshCw, FiTool } from "react-icons/fi";
import toast from "react-hot-toast";
import { SellerEmpty, SellerHeader, SellerPage } from "../components/SellerUI";

function AdminOperations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [recoveries, setRecoveries] = useState([]);
  const [sending, setSending] = useState("");
  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/operations`)
      .then(({ data: response }) => { if (active) setData(response); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);
  useEffect(() => { let active = true; axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/cart-recoveries`).then(({ data: response }) => { if (active) setRecoveries(response.recoveries || []); }).catch(() => { if (active) setRecoveries([]); }); return () => { active = false; }; }, [reloadKey]);

  const sendRecovery = async (recovery) => {
    if (!window.confirm(`Send one saved-cart reminder to ${recovery.email}?`)) return;
    setSending(recovery.id);
    try { const { data: response } = await axios.post(`${import.meta.env.VITE_API_URL}/api/dashboard/cart-recoveries/${recovery.id}/send`); setRecoveries((current) => current.filter((item) => item.id !== recovery.id)); toast.success(response.message); setReloadKey((value) => value + 1); }
    catch (error) { toast.error(error.response?.data?.message || "Recovery email could not be sent"); }
    finally { setSending(""); }
  };

  const requiredProblems = data?.services?.filter((service) => service.required && !service.ready) || [];
  return <SellerPage>
    <SellerHeader title="Operations" description="Production readiness, actionable alerts and a record of sensitive seller actions." action={<button type="button" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="btn-secondary"><FiRefreshCw/> Refresh</button>}/>
    {!loading && !data ? <SellerEmpty title="Operations data is unavailable" description="Refresh while the server reconnects."/> : <>
      <section className={`rounded-2xl border p-5 md:p-6 ${requiredProblems.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}><div className="flex items-start gap-3">{requiredProblems.length ? <FiAlertTriangle className="mt-1 text-xl text-red-700"/> : <FiCheckCircle className="mt-1 text-xl text-emerald-700"/>}<div><h2 className="font-semibold">{loading ? "Checking production services…" : requiredProblems.length ? `${requiredProblems.length} required service${requiredProblems.length > 1 ? "s need" : " needs"} configuration` : "Required services are configured"}</h2><p className="mt-1 text-sm text-slate-600">This checks whether required server settings exist. It never displays secret values.</p></div></div></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(data?.services || []).map((service) => <article key={service.key} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${service.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><FiTool/></span><div><h3 className="font-semibold">{service.label}</h3><p className="text-xs text-slate-400">{service.required ? "Required" : "Optional"}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${service.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{service.ready ? "Configured" : "Not configured"}</span></div></article>)}</div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><article className={`rounded-2xl border p-5 ${data?.alerts?.failedRefunds ? "border-red-200 bg-red-50" : "bg-white"}`}><p className="text-sm text-slate-500">Failed refunds requiring attention</p><p className="mt-2 text-3xl font-bold">{data?.alerts?.failedRefunds || 0}</p></article><article className={`rounded-2xl border p-5 ${data?.alerts?.pendingRefunds ? "border-amber-200 bg-amber-50" : "bg-white"}`}><p className="text-sm text-slate-500">Refunds processing</p><p className="mt-2 text-3xl font-bold">{data?.alerts?.pendingRefunds || 0}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Saved carts inactive for 2+ hours</p><p className="mt-2 text-3xl font-bold">{data?.alerts?.abandonedCarts || 0}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Consent-eligible recoveries</p><p className="mt-2 text-3xl font-bold">{data?.alerts?.recoveryEligible || 0}</p><p className="mt-2 text-xs text-slate-400">No recovery message is sent automatically.</p></article></div>
      <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-5 md:px-6"><h2 className="text-lg font-semibold">Saved-cart recovery</h2><p className="mt-1 text-sm text-slate-500">Only customers who enabled optional shopping emails appear here. Each cart version can receive one reminder.</p></div>{!recoveries.length ? <SellerEmpty title="No eligible saved carts" description="Inactive carts with customer consent will appear here."/> : <div className="divide-y">{recoveries.map((recovery) => <article key={recovery.id} className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center md:px-6"><div><p className="font-semibold">{recovery.customer}</p><p className="mt-1 text-xs text-slate-500">{recovery.email} · {recovery.itemCount} item{recovery.itemCount === 1 ? "" : "s"} · inactive since {new Date(recovery.inactiveSince).toLocaleString("en-IN")}</p></div><button type="button" disabled={sending === recovery.id} onClick={() => sendRecovery(recovery)} className="btn-secondary shrink-0 disabled:opacity-50"><FiMail/> {sending === recovery.id ? "Sending…" : "Send one reminder"}</button></article>)}</div>}</section>
      <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-5 md:px-6"><h2 className="text-lg font-semibold">Seller activity log</h2><p className="mt-1 text-sm text-slate-500">Order, tracking, refund and review moderation actions are retained for one year.</p></div>{!data?.recentActivity?.length ? <SellerEmpty title="No recorded seller actions yet" description="New sensitive actions will appear here."/> : <div className="divide-y">{data.recentActivity.map((entry) => <article key={entry._id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center md:px-6"><div className="min-w-0"><p className="font-semibold text-slate-900">{entry.summary || entry.action}</p><p className="mt-1 truncate text-xs text-slate-500">{entry.actorEmail || "Seller"} · {entry.entityType} {entry.entityId ? `#${String(entry.entityId).slice(-8).toUpperCase()}` : ""}</p></div><time className="shrink-0 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString("en-IN")}</time></article>)}</div>}</section>
    </>}
  </SellerPage>;
}

export default AdminOperations;
