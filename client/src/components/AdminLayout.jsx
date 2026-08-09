import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";

const links = [
  ["/admin/dashboard", "Overview", "▦"],
  ["/admin", "Products", "◇"],
  ["/admin/orders", "Orders", "▤"],
  ["/admin/coupons", "Coupons", "%"],
  ["/admin/contacts", "Messages", "✉"],
];

function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("user");
    delete axios.defaults.headers.common.Authorization;
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-[#f5f6f4] text-slate-900 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b bg-[#183d2b] px-5 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:px-4 lg:py-6">
        <div className="flex items-center justify-between lg:block">
          <img src={logo} alt="Tamanna's Hut seller" className="h-14 w-auto rounded-lg bg-white/95 px-2" />
          <button onClick={logout} className="rounded-lg border border-white/20 px-3 py-2 text-sm lg:hidden">Logout</button>
        </div>
        <p className="mt-5 hidden px-3 text-xs font-semibold uppercase tracking-[3px] text-white/50 lg:block">Seller centre</p>
        <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === "/admin"} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-white text-[#183d2b] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
              <span className="text-base">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 hidden lg:block">
          <a href="/" className="block rounded-xl border border-white/15 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/10">View storefront</a>
          <button onClick={logout} className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white">Sign out</button>
        </div>
      </aside>
      <main className="min-w-0"><Outlet /></main>
    </div>
  );
}

export default AdminLayout;
