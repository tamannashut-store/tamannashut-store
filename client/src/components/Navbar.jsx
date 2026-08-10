import { useContext, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiChevronRight, FiHeart, FiLogOut, FiMenu, FiPackage, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import logo from "../assets/logo.png";
import { CartContext } from "../context/CartContext";

const navItems = [["/shop?category=girls","Girls"],["/shop?category=boys","Boys"],["/shop?category=new-arrivals","New arrivals"],["/about","About"],["/contact","Contact"]];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems.reduce((total, item) => total + Number(item.qty || 0), 0);
  const userData = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  const submitSearch = (event) => { event.preventDefault(); if (search.trim()) navigate(`/shop?search=${encodeURIComponent(search.trim())}`); setSearchOpen(false); setMenuOpen(false); };
  const logout = () => { localStorage.removeItem("user"); delete axios.defaults.headers.common.Authorization; window.dispatchEvent(new Event("cartUpdated")); setProfileOpen(false); navigate("/"); };
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);

  return <>
    <div className="bg-[#183d2b] text-white"><div className="mx-auto flex h-9 max-w-[1400px] items-center justify-center gap-5 px-4 text-[11px] font-medium sm:gap-10 sm:text-xs"><span>Free shipping above ₹999</span><span className="hidden sm:inline">Cash on delivery available</span><span>Easy returns</span></div></div>
    <header className="sticky top-0 z-50 border-b border-[#e8e5de] bg-[#fcfbf8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] max-w-[1400px] items-center gap-5 px-4 sm:px-6">
        <Link to="/" className="mr-auto shrink-0"><img src={logo} alt="Tamanna's Hut" className="h-14 w-auto object-contain" /></Link>
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">{navItems.map(([to,label]) => <NavLink key={to} to={to} className="whitespace-nowrap text-sm font-semibold text-slate-600 transition hover:text-[#183d2b]">{label}</NavLink>)}</nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-[#183d2b] hover:bg-[#eef3ee]"><FiSearch size={20}/></button>
          <Link to="/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 place-items-center rounded-full text-[#183d2b] hover:bg-[#eef3ee] sm:grid"><FiHeart size={20}/></Link>
          <Link to="/cart" aria-label={`Cart with ${cartCount} items`} className="relative grid h-10 w-10 place-items-center rounded-full text-[#183d2b] hover:bg-[#eef3ee]"><FiShoppingBag size={20}/>{cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#b94545] px-1 text-[10px] font-bold text-white">{cartCount}</span>}</Link>
          {userData ? <div className="relative hidden md:block"><button type="button" onClick={() => setProfileOpen((open) => !open)} aria-label="Account" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-[#183d2b]"><FiUser size={19}/></button>{profileOpen && <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl"><Link to="/profile" className="block px-4 py-2.5 text-sm hover:bg-slate-50">Profile</Link><Link to="/my-orders" className="block px-4 py-2.5 text-sm hover:bg-slate-50">My orders</Link>{userData?.user?.isAdmin && <Link to="/admin/dashboard" className="block px-4 py-2.5 text-sm hover:bg-slate-50">Seller centre</Link>}<button type="button" onClick={logout} className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">Sign out</button></div>}</div> : <Link to="/login" className="hidden rounded-full border border-[#183d2b] px-5 py-2 text-sm font-semibold text-[#183d2b] hover:bg-[#183d2b] hover:text-white md:block">Sign in</Link>}
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-full text-[#183d2b] lg:hidden">{menuOpen ? <FiX size={24}/> : <FiMenu size={24}/>}</button>
        </div>
      </div>
      {searchOpen && <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg"><form onSubmit={submitSearch} className="mx-auto flex max-w-2xl gap-2"><input autoFocus className="field-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dresses, sets and more"/><button className="btn-primary">Search</button></form></div>}
    </header>
    {menuOpen && <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 h-full w-full cursor-default bg-slate-950/45 backdrop-blur-[2px]" />
      <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col overflow-y-auto bg-[#fcfbf8] shadow-2xl">
        <div className="flex min-h-[78px] items-center justify-between border-b border-slate-200 px-5"><Link to="/" aria-label="Tamanna's Hut home"><img src={logo} alt="" className="h-12 w-auto" /></Link><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-[#183d2b]"><FiX size={23}/></button></div>
        <form onSubmit={submitSearch} className="m-5 flex items-center rounded-xl border border-slate-200 bg-white px-3"><FiSearch className="shrink-0 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products" placeholder="Search products" className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 outline-none focus:shadow-none"/><button className="text-sm font-semibold text-[#183d2b]">Search</button></form>
        <nav className="px-3" aria-label="Mobile navigation">{navItems.map(([to,label]) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="flex min-h-13 items-center justify-between rounded-xl px-3 font-semibold text-slate-700 hover:bg-[#eef3ee] hover:text-[#183d2b]"><span>{label}</span><FiChevronRight className="text-slate-400"/></Link>)}</nav>
        <div className="mx-5 my-4 border-t border-slate-200"/>
        <nav className="space-y-1 px-3" aria-label="Account navigation"><Link to="/wishlist" onClick={() => setMenuOpen(false)} className="flex min-h-13 items-center gap-3 rounded-xl px-3 font-medium text-slate-700 hover:bg-[#eef3ee]"><FiHeart/> Wishlist</Link><Link to="/cart" onClick={() => setMenuOpen(false)} className="flex min-h-13 items-center gap-3 rounded-xl px-3 font-medium text-slate-700 hover:bg-[#eef3ee]"><FiShoppingBag/> Cart {cartCount > 0 && <span className="ml-auto rounded-full bg-[#b94545] px-2 py-0.5 text-xs font-bold text-white">{cartCount}</span>}</Link>{userData && <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="flex min-h-13 items-center gap-3 rounded-xl px-3 font-medium text-slate-700 hover:bg-[#eef3ee]"><FiPackage/> My orders</Link>}</nav>
        <div className="mt-auto border-t border-slate-200 p-5">{userData ? <div className="space-y-2"><Link to="/profile" onClick={() => setMenuOpen(false)} className="btn-primary w-full"><FiUser className="mr-2"/> My account</Link>{userData?.user?.isAdmin && <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="btn-secondary w-full">Seller centre</Link>}<button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-red-600"><FiLogOut/> Sign out</button></div> : <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full"><FiUser className="mr-2"/> Sign in</Link>}</div>
      </aside>
    </div>}
  </>;
}
export default Navbar;
