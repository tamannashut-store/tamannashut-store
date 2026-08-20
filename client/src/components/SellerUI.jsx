export function SellerPage({ children }) {
  return <div className="mx-auto w-full max-w-[1500px] p-5 md:p-8 lg:p-10">{children}</div>;
}

export function SellerHeader({ eyebrow = "Seller centre", title, description, action }) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#397153]">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>
      {action}
    </header>
  );
}

export function SellerEmpty({ title, description }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h3 className="text-lg font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm text-slate-500">{description}</p></div>;
}

export function StatusBadge({ value }) {
  const normalized = String(value || "pending").toLowerCase();
  const colors = ["delivered", "refunded", "active", "verified", "paid", "matched"].includes(normalized) ? "bg-emerald-50 text-emerald-700" : ["cancelled", "archived", "rto delivered", "rejected", "closed", "failed", "exception"].includes(normalized) ? "bg-red-50 text-red-700" : ["confirmed", "packed", "shipped", "processing"].includes(normalized) ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${colors}`}>{String(value || "Pending").replaceAll("_", " ")}</span>;
}
