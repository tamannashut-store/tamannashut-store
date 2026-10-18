import { useState } from "react";
import { measurementInCm, parseSizeChart } from "../utils/sizeChart";

export default function ProductSizeChart({ text, color, size }) {
  const [unit, setUnit] = useState("inches");
  const chart = parseSizeChart(text);
  const matching = chart?.sections.filter((section) => section.title.toLowerCase() === String(color || "").toLowerCase());
  const sections = matching?.length ? matching : chart?.sections;
  return <details className="group mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
      <span>Size guide &amp; measurements</span><span aria-hidden="true" className="text-lg group-open:rotate-45">+</span>
    </summary>
    <div className="border-t border-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"><p className="text-xs leading-5 text-slate-600">Compare with a garment that fits. Age is a guide.</p>{chart?.inches && <div role="group" aria-label="Measurement unit" className="flex shrink-0 rounded-lg bg-slate-100 p-1">{["inches", "cm"].map((option) => <button key={option} type="button" aria-pressed={unit === option} onClick={() => setUnit(option)} className={`min-h-10 rounded-md px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-brand-primary ${unit === option ? "bg-brand-primary text-white" : "text-slate-600"}`}>{option === "inches" ? "Inches" : "cm"}</button>)}</div>}</div>
      {chart ? <>{sections.map((section, index) => <div key={index}>
        {section.title && <h3 className="px-4 pb-2 text-sm font-semibold text-slate-800">{section.title}</h3>}
        <div tabIndex={0} role="region" aria-label={`${section.title || "Product"} size measurements`} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-primary">
          <table className="w-full min-w-[420px] border-collapse text-left text-xs tabular-nums">
            <caption className="sr-only">Garment measurements{chart.inches ? ` in ${unit}` : ""}</caption>
            <thead className="bg-slate-50 text-slate-600"><tr>{section.columns.map((column, i) => <th key={i} scope="col" className="px-3 py-3 font-semibold capitalize first:pl-4">{column}</th>)}</tr></thead>
            <tbody>{section.rows.map((row) => <tr key={row[0]} className={`border-t border-slate-100 ${row[0] === size ? "bg-emerald-50 text-emerald-950" : "text-slate-700"}`}>
              {row.map((cell, i) => i === 0 ? <th key={i} scope="row" className="whitespace-nowrap py-3 pl-4 pr-3 font-semibold">{cell}</th> : <td key={i} className="px-3 py-3">{chart.inches && unit === "cm" ? measurementInCm(cell) : cell}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </div>)}<div className="space-y-2 px-4 py-3 text-xs leading-5 text-slate-500"><p className="sm:hidden">Swipe across to see every measurement.</p>{chart.inches && unit === "cm" && <p>Table values converted from inches and rounded to 0.1 cm. Supplier notes below retain their original units.</p>}{chart.notes.map((note, i) => <p key={i}>{note}</p>)}</div></> : <p className="whitespace-pre-line px-4 pb-4 text-sm leading-7 text-slate-700">{text}</p>}
    </div>
  </details>;
}
