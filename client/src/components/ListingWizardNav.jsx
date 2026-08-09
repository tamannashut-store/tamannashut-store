const steps = ["Basics", "Colours & stock", "Photos", "Review & publish"];

export default function ListingWizardNav({ current, onChange }) {
  return <nav aria-label="Listing progress" className="surface-card mb-6 overflow-hidden p-2"><ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">{steps.map((label, index) => <li key={label}><button type="button" onClick={() => onChange(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${current === index ? "bg-[#183d2b] text-white" : index < current ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${current === index ? "bg-white text-[#183d2b]" : "bg-slate-100 text-slate-500"}`}>{index < current ? "✓" : index + 1}</span><span>{label}</span></button></li>)}</ol></nav>;
}

export function WizardActions({ current, onBack, onNext, busy, submitLabel = "Publish listing" }) {
  return <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"><button type="button" onClick={onBack} disabled={current === 0} className="btn-secondary disabled:invisible">Back</button><p className="hidden text-sm text-slate-500 sm:block">Step {current + 1} of 4</p>{current < 3 ? <button type="button" onClick={onNext} className="btn-primary">Continue</button> : <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : submitLabel}</button>}</div>;
}
