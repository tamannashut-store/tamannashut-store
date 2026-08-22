import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import PageMeta from "./PageMeta";

function StoreLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-background text-brand-dark">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 font-semibold text-brand-primary shadow-xl transition-transform focus:translate-y-0">Skip to main content</a>
      <Navbar />
      <PageMeta />
      <div id="main-content" tabIndex={-1} className="flex-1 outline-none"><Outlet /></div>
      <WhatsAppButton />
      <Footer />
    </div>
  );
}

export default StoreLayout;
