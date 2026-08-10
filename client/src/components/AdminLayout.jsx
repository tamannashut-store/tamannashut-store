import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiBarChart2, FiBox, FiExternalLink, FiLogOut, FiMenu, FiMessageSquare, FiPercent, FiShoppingBag, FiStar, FiX } from "react-icons/fi";
import logo from "../assets/logo.png";

const links = [
  ["/admin/dashboard", "Overview", FiBarChart2],
  ["/admin", "Products", FiBox],
  ["/admin/orders", "Orders", FiShoppingBag],
  ["/admin/reviews", "Reviews", FiStar],
  ["/admin/coupons", "Coupons", FiPercent],
  ["/admin/contacts", "Messages", FiMessageSquare],
];

function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem("user");
    delete axios.defaults.headers.common.Authorization;
    navigate("/admin-login");
  };
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-slate-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="z-20 border-b bg-[#123b29] px-4 py-3 text-white lg:sticky lg:top-0 lg:h-screen lg:border-0 lg:px-5 lg:py-7">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Tamanna's Hut seller centre" className="h-14 w-auto rounded-xl bg-white px-2 py-1" />
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open seller menu" className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-white lg:hidden"><FiMenu size={22}/></button>
        </div>
        <div className="mt-6 hidden lg:block"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Seller centre</p><p className="mt-2 px-3 text-sm text-white/70">Manage your store</p></div>
        <nav className="mt-8 hidden flex-col gap-2 lg:flex">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/admin"} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-white text-[#123b29] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="text-base" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-7 left-5 right-5 hidden border-t border-white/10 pt-4 lg:block">
          <a href="/" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">View storefront <FiExternalLink /></a>
          <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white"><FiLogOut /> Sign out</button>
        </div>
      </aside>
      <main className="min-w-0"><Outlet /></main>
      {menuOpen && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Seller navigation"><button type="button" aria-label="Close seller menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 h-full w-full bg-slate-950/50"/><aside className="absolute right-0 top-0 flex h-full w-[min(88vw,340px)] flex-col bg-[#123b29] p-5 text-white shadow-2xl"><div className="flex items-center justify-between"><img src={logo} alt="" className="h-14 w-auto rounded-xl bg-white px-2 py-1"/><button type="button" aria-label="Close seller menu" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/20"><FiX size={22}/></button></div><p className="mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Seller centre</p><nav className="mt-3 space-y-2">{links.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to === "/admin"} onClick={() => setMenuOpen(false)} className={({isActive}) => `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold ${isActive ? "bg-white text-[#123b29]" : "text-white/75 hover:bg-white/10"}`}><Icon/>{label}</NavLink>)}</nav><div className="mt-auto border-t border-white/10 pt-4"><a href="/" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/75">View storefront <FiExternalLink/></a><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-200"><FiLogOut/> Sign out</button></div></aside></div>}
    </div>
  );
}

export default AdminLayout;
