import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiBarChart2, FiBox, FiExternalLink, FiLogOut, FiMessageSquare, FiPercent, FiShoppingBag } from "react-icons/fi";
import logo from "../assets/logo.png";

const links = [
  ["/admin/dashboard", "Overview", FiBarChart2],
  ["/admin", "Products", FiBox],
  ["/admin/orders", "Orders", FiShoppingBag],
  ["/admin/coupons", "Coupons", FiPercent],
  ["/admin/contacts", "Messages", FiMessageSquare],
];

function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("user");
    delete axios.defaults.headers.common.Authorization;
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-slate-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="z-20 border-b bg-[#123b29] px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:border-0 lg:px-5 lg:py-7">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Tamanna's Hut seller centre" className="h-14 w-auto rounded-xl bg-white px-2 py-1" />
          <button type="button" onClick={logout} aria-label="Sign out" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white/80 lg:hidden"><FiLogOut /></button>
        </div>
        <div className="mt-6 hidden lg:block"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Seller centre</p><p className="mt-2 px-3 text-sm text-white/70">Manage your store</p></div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible">
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
    </div>
  );
}

export default AdminLayout;
