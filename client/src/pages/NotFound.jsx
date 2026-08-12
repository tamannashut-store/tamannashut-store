import { FiArrowLeft, FiHome, FiSearch } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="relative isolate grid min-h-[68vh] place-items-center overflow-hidden px-5 py-16 sm:px-6 sm:py-24">
      <Helmet>
        <title>Page Not Found | Tamanna&apos;s Hut</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute left-[-6rem] top-12 h-64 w-64 rounded-full bg-[#dfe9df]/70 blur-3xl" />
        <div className="absolute bottom-8 right-[-5rem] h-72 w-72 rounded-full bg-[#efe4cf]/70 blur-3xl" />
      </div>

      <section className="w-full max-w-2xl rounded-[2rem] border border-[#dfe4df] bg-white/95 px-6 py-12 text-center shadow-[0_22px_60px_rgba(30,50,36,0.10)] sm:px-12 sm:py-16">
        <p className="eyebrow">Error 404</p>
        <p aria-hidden="true" className="mt-4 font-serif text-[clamp(5rem,18vw,9rem)] leading-none text-[#dce7dc]">404</p>
        <h1 className="-mt-3 font-serif text-3xl font-semibold text-slate-950 sm:text-5xl">This page wandered off</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
          The link may be outdated or the page may have moved. Your account, cart and orders are safe.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link to="/" className="btn-primary gap-2"><FiHome aria-hidden="true" /> Home</Link>
          <Link to="/shop" className="btn-secondary gap-2"><FiSearch aria-hidden="true" /> Shop products</Link>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary gap-2"><FiArrowLeft aria-hidden="true" /> Go back</button>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
