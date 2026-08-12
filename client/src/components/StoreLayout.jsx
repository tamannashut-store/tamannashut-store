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
      <Navbar />
      <PageMeta />
      <div className="flex-1"><Outlet /></div>
      <WhatsAppButton />
      <Footer />
    </div>
  );
}

export default StoreLayout;
