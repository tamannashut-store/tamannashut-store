import { FiShoppingBag } from "react-icons/fi";
import platformLogo from "../assets/logo.png";
export default function StoreIdentity({ store, large = false }) {
  const logo = store.logoUrl || (store.name === "Tamanna's Hut" ? platformLogo : "");
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white ${large ? "h-24 w-24 sm:h-28 sm:w-28" : "h-14 w-14"}`}>
    {logo ? <img src={logo} alt={`${store.name} logo`} className="h-full w-full object-contain p-2" /> : <FiShoppingBag aria-hidden="true" className={`${large ? "h-10 w-10" : "h-6 w-6"} text-brand-primary`} />}
  </span>;
}
