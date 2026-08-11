function AppErrorFallback() {
  return <main className="grid min-h-screen place-items-center bg-brand-background px-6 text-center"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 shadow-xl"><p className="eyebrow">Something went wrong</p><h1 className="mt-3 text-3xl font-bold">This page could not be displayed</h1><p className="mt-3 text-slate-500">Your cart and account are safe. Reload the latest version of this page, or return to the storefront.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><a href="/" className="btn-secondary">Return home</a><button type="button" onClick={() => window.location.reload()} className="btn-primary">Reload page</button></div></section></main>;
}

export default AppErrorFallback;
