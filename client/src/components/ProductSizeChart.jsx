import { parseSizeChart } from "../utils/sizeChart";

export default function ProductSizeChart({ text, color, size }) {
  const chart = parseSizeChart(text);
  const matching = chart?.sections.filter((section) => section.title.toLowerCase() === String(color || "").toLowerCase());
  const sections = matching?.length ? matching : chart?.sections;
  return <details className="group mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
      <span>Size guide &amp; measurements</span><span aria-hidden="true" className="text-lg group-open:rotate-45">+</span>
    </summary>
    <div className="border-t border-slate-100">
      <div className="flex items-start justify-between gap-3 px-4 py-3"><p className="text-xs leading-5 text-slate-600">Compare with a garment that fits. Age is a guide.</p>{chart?.inches && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Inches</span>}</div>
      {chart ? <>{sections.map((section, index) => <div key={index}>
        {section.title && <h3 className="px-4 pb-2 text-sm font-semibold text-slate-800">{section.title}</h3>}
        <div tabIndex={0} role="region" aria-label={`${section.title || "Product"} size measurements`} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-primary">
          <table className="w-full min-w-[420px] border-collapse text-left text-xs tabular-nums">
            <caption className="sr-only">Garment measurements{chart.inches ? " in inches" : ""}</caption>
            <thead className="bg-slate-50 text-slate-600"><tr>{section.columns.map((column, i) => <th key={i} scope="col" className="px-3 py-3 font-semibold capitalize first:pl-4">{column}</th>)}</tr></thead>
            <tbody>{section.rows.map((row) => <tr key={row[0]} className={`border-t border-slate-100 ${row[0] === size ? "bg-emerald-50 text-emerald-950" : "text-slate-700"}`}>
              {row.map((cell, i) => i === 0 ? <th key={i} scope="row" className="whitespace-nowrap py-3 pl-4 pr-3 font-semibold">{cell}</th> : <td key={i} className="px-3 py-3">{cell}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </div>)}<div className="space-y-2 px-4 py-3 text-xs leading-5 text-slate-500"><p className="sm:hidden">Swipe across to see every measurement.</p>{chart.notes.map((note, i) => <p key={i}>{note}</p>)}</div></> : <p className="whitespace-pre-line px-4 pb-4 text-sm leading-7 text-slate-700">{text}</p>}
    </div>
  </details>;
}
