import { FiCheck } from "react-icons/fi";

function AuthShell({ eyebrow, title, description, asideTitle, asideCopy, asideItems = [], icon: Icon, children }) {
  return <main className="bg-[#f7f5ef] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(25,55,37,.12)] lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#123b29] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <p className="relative text-xs font-bold uppercase tracking-[.24em] text-white/55">Tamanna&apos;s Hut</p>
        <div className="relative py-16"><p className="text-xs font-bold uppercase tracking-[.24em] text-white/55">Secure customer account</p><h2 className="mt-4 font-serif text-5xl leading-tight">{asideTitle}</h2><p className="mt-5 max-w-sm leading-7 text-white/65">{asideCopy}</p>{asideItems.length > 0 && <ul className="mt-8 space-y-3 text-sm text-white/75">{asideItems.map((item) => <li key={item} className="flex items-center gap-3"><FiCheck /> {item}</li>)}</ul>}</div>
        <p className="relative text-xs text-white/40">Comfort-first kidswear, thoughtfully delivered.</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          {Icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef5f0] text-xl text-brand-primary"><Icon /></span>}
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#397153]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
          {children}
        </div>
      </section>
    </div>
  </main>;
}

export default AuthShell;
