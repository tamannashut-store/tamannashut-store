import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-background text-brand-dark">
      <Navbar />
      <div className="flex-1"><Outlet /></div>
      <WhatsAppButton />
      <Footer />
    </div>
  );
}

export default StoreLayout;
