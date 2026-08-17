import { Link } from "react-router-dom";
import { FaAmazon, FaFacebookF, FaInstagram } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

const external = [
  ["Facebook", "https://www.facebook.com/tamannashut", FaFacebookF],
  ["Instagram", "https://www.instagram.com/tamannashut", FaInstagram],
  ["Meesho", "https://www.meesho.com/TamannasHut", FiExternalLink],
  ["Amazon", "https://www.amazon.in/gp/product/B0H8WN1LYN?th=1&psc=1", FaAmazon],
  ["Flipkart", "https://www.flipkart.com/product/p/itme?pid=KPBHZH2RGAHZGAKX", FiExternalLink],
];

function Footer() {
  return <footer className="bg-[#123b29] text-white">
    <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
      <div><h2 className="font-serif text-3xl">Tamanna&apos;s Hut</h2><p className="mt-4 max-w-xs text-sm leading-6 text-white/65">Comfort-first kidswear for everyday moments and celebrations.</p><div className="mt-5 flex gap-2">{external.slice(0,2).map(([label,url,Icon]) => <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:bg-white hover:text-[#123b29]"><Icon /></a>)}</div></div>
      <div><h3 className="font-semibold">Shop</h3><div className="mt-4 space-y-2 text-sm text-white/65"><Link className="block hover:text-white" to="/shop?category=girls">Girls</Link><Link className="block hover:text-white" to="/shop?category=boys">Boys</Link><Link className="block hover:text-white" to="/shop?category=new-arrivals">New arrivals</Link><Link className="block hover:text-white" to="/shop">All products</Link></div></div>
      <div><h3 className="font-semibold">Customer care</h3><div className="mt-4 space-y-2 text-sm text-white/65"><Link className="block hover:text-white" to="/about">About us</Link><Link className="block hover:text-white" to="/contact">Contact us</Link><Link className="block hover:text-white" to="/return-policy">Returns, refunds & cancellations</Link><Link className="block hover:text-white" to="/shipping-policy">Shipping</Link><Link className="block hover:text-white" to="/privacy-policy">Privacy</Link><Link className="block hover:text-white" to="/terms-conditions">Terms</Link></div></div>
      <div><h3 className="font-semibold">Find us online</h3><div className="mt-4 space-y-2">{external.slice(2).map(([label,url,Icon]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"><span className="flex items-center gap-2"><Icon />{label}</span><FiExternalLink /></a>)}</div><div className="mt-5 text-sm text-white/65"><a href="mailto:support@tamannashut.com" className="block hover:text-white">support@tamannashut.com</a><a href="tel:+919874328578" className="mt-2 block hover:text-white">+91 98743 28578</a></div></div>
    </div>
    <div className="border-t border-white/10 px-6 py-5 text-center text-xs leading-5 text-white/70"><p>Owned and operated by Tamanna Enterprise · GSTIN 19BKDPB6636D1ZE</p><p>House No. N0072, Ground Floor, Raghudebbati West, Sankrail, Howrah, West Bengal 711310</p><p className="mt-1">© 2026 Tamanna&apos;s Hut. All rights reserved.</p></div>
  </footer>;
}
export default Footer;
