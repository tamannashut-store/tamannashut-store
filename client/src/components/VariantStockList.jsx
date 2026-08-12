import { lowStockVariants } from "../utils/inventory";

export default function VariantStockList({ product }) {
  const low = lowStockVariants(product);
  if (!low.length) return <p className="text-sm text-emerald-700">All active variants are above the alert level.</p>;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {low.map((variant, index) => {
        const stock = Number(variant.stock || 0);
        return <div key={variant.sku || `${variant.color}-${variant.size}-${index}`} className={`rounded-xl border p-3 ${stock === 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="font-semibold text-slate-900">{variant.color || "Default colour"} · {variant.size || "One size"}</p><p className="mt-1 truncate font-mono text-[11px] text-slate-500">{variant.sku || "Legacy inventory"}</p></div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{stock === 0 ? "Out" : `${stock} left`}</span>
          </div>
        </div>;
      })}
    </div>
  );
}
