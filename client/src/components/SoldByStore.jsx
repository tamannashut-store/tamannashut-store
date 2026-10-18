import StoreMetrics from "./StoreMetrics";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import StoreIdentity from "./StoreIdentity";
export default function SoldByStore({ store }) {
  return <section aria-label="Sold by" className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Sold by</p>
    <div className="mt-3 grid min-w-0 gap-4">
      <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-3">
        <StoreIdentity store={store} />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 text-slate-900 sm:text-base">{store.name}</p>
          {Number.isFinite(store.productCount) && <p className="mt-1 text-xs text-slate-500">{store.productCount} {store.productCount === 1 ? "product" : "products"}</p>}
        </div>
      </div>
      <div className="min-w-0 border-t border-slate-200 pt-1"><StoreMetrics store={store} /></div>
      <Link to={store.path} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-primary/25 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" aria-label={`View ${store.name} shop`}>Visit store <FiArrowRight aria-hidden="true" className="shrink-0" /></Link>
    </div>
  </section>;
}
