import StoreMetrics from "./StoreMetrics";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import StoreIdentity from "./StoreIdentity";
export default function SoldByStore({ store }) {
  return <section aria-label="Sold by" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Sold by</p>
    <div className="mt-3 flex flex-wrap items-center gap-4"><StoreIdentity store={store} /><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{store.name}</p>{Number.isFinite(store.productCount) && <p className="mt-1 text-sm text-slate-500">{store.productCount} {store.productCount === 1 ? "product" : "products"}</p>}<StoreMetrics store={store} /></div><Link to={store.path} className="btn-secondary gap-2 whitespace-nowrap" aria-label={`View ${store.name} shop`}>View shop <FiArrowRight aria-hidden="true" /></Link></div>
  </section>;
}
