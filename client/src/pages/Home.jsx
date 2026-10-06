import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiArrowRight, FiExternalLink, FiHeart, FiRefreshCw, FiShield, FiTruck, FiSearch, FiGrid, FiHome, FiMonitor, FiShoppingBag, FiBookOpen, FiActivity, FiSmile } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { getProducts } from "../api/productApi";
import WishlistContext from "../context/wishlistState";
import ProductImageSlider from "../components/ProductImageSlider";
import SkeletonProduct from "../components/SkeletonProduct";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { productPath } from "../utils/productUrl";
import { isCanceledRequest } from "../utils/retryRequest";
import { useReloadOnPageResume } from "../utils/useReloadOnPageResume";

const plannedDepartments = [
  { key: "home-kitchen", label: "Home & kitchen", Icon: FiHome, match: /home|kitchen|garden|furniture/ },
  { key: "electronics", label: "Electronics", Icon: FiMonitor, match: /electronic|mobile|computer/ },
  { key: "beauty", label: "Beauty & care", Icon: FiSmile, match: /beauty|personal-care|health/ },
  { key: "fashion", label: "Fashion & accessories", Icon: FiShoppingBag, match: /girls|boys|clothing|fashion|footwear|accessor|bags|new-arrivals/ },
  { key: "sports", label: "Sports & outdoors", Icon: FiActivity, match: /sports|outdoor/ },
  { key: "books", label: "Books & stationery", Icon: FiBookOpen, match: /book|stationery/ },
];
const departmentIcon = (key) => plannedDepartments.find((department) => department.match.test(key))?.Icon || FiGrid;

function ProductCard({ product, onWishlist, campaignId }) {
  const mrp = Number(product.mrp || product.price);
  const price = Number(product.price);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <ProductImageSlider product={product} className="h-64" />
        <button type="button" onClick={() => onWishlist(product)} aria-label={`Save ${product.name}`} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:text-brand-primary">
          <FiHeart />
        </button>
        {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#183d2b] px-3 py-1 text-xs font-semibold text-white">{discount}% off</span>}
        {campaignId && <span className="absolute bottom-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">Sponsored</span>}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{String(product.category || "Products").replace("-", " ")}</p>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{product.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#183d2b]">₹{price.toLocaleString("en-IN")}</span>
          {mrp > price && <span className="text-sm text-slate-600 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
        <Link to={productPath(product)} onClick={() => campaignId && fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/ads/${campaignId}/click`, { method: "POST", keepalive: true }).catch(() => {})} className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-[#183d2b]">
          View details <FiArrowRight />
        </Link>
      </div>
    </article>
  );
}

function Home() {
  const navigate = useNavigate();
  const [homeSearch, setHomeSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const { addToWishlist } = useContext(WishlistContext);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getProducts({ limit: 12 }, { signal: controller.signal })
      .then(({ data }) => { if (active) { setProducts(Array.isArray(data) ? data : data.products || []); setLoadError(false); } })
      .catch((error) => { if (active && !isCanceledRequest(error)) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reloadKey]);

  useReloadOnPageResume(setReloadKey);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/products/categories`, { signal: controller.signal }).then((response) => response.ok ? response.json() : {}).then((data) => setDepartments(Array.isArray(data.categories) ? data.categories : [])).catch(() => {});
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/social/instagram`)
      .then((response) => response.ok ? response.json() : { posts: [] })
      .then((data) => { if (active) setInstagramPosts(Array.isArray(data.posts) ? data.posts : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/ads/placements/home`).then((response) => response.ok ? response.json() : { campaigns: [] }).then((data) => { if (active) setSponsored(data.campaigns || []); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const categoryCards = useMemo(() => departments.length ? departments : [...new Set(products.map((product) => product.category).filter(Boolean))].map((key) => ({ key, label: key.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), image: products.find((product) => product.category === key)?.images?.[0]?.url || null })), [products, departments]);
  const heroProducts = products.slice(0, 6);

  return (
    <>
      <Helmet>
        <title>Tamanna&apos;s Hut | Discover Your Everyday</title>
        <meta name="description" content="Discover products across our growing catalogue at Tamanna's Hut. Shop securely and track every order." />
        <link rel="canonical" href="https://www.tamannashut.com/" />
      </Helmet>

      <main className="bg-[#f5f7fa]">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1400px] gap-7 px-5 py-8 md:px-8 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:py-10">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Welcome to Tamanna&apos;s Hut</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">One store. More possibilities.</h1><p className="mt-3 max-w-xl text-base leading-7 text-slate-600">Search our products, explore departments and find what you need for everyday life.</p>
              <form role="search" aria-label="Find products" onSubmit={(event) => { event.preventDefault(); navigate(homeSearch.trim() ? `/shop?search=${encodeURIComponent(homeSearch.trim())}` : "/shop"); }} className="mt-5 flex max-w-2xl items-center gap-2 rounded-xl border-2 border-brand-primary bg-white p-1.5"><FiSearch className="ml-2 shrink-0 text-lg text-slate-400"/><input aria-label="Search products, brands and categories" placeholder="Search products, brands and categories" value={homeSearch} onChange={(event) => setHomeSearch(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm outline-none"/><button type="submit" className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button></form>
            </div>
            <div className="grid grid-cols-3 gap-3">{[[FiGrid,"Shop all","Browse products","/shop"],[FiTruck,"Your orders","Track & manage","/my-orders"],[FiShield,"Need help?","Customer support","/help"]].map(([Icon,title,copy,url]) => <Link key={title} to={url} className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-primary hover:bg-white sm:p-4"><Icon className="mb-3 text-2xl text-brand-primary"/><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></Link>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-7 md:px-8" aria-label="Departments">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-slate-950">Shop by department</h2><Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">Browse all <FiArrowRight /></Link></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categoryCards.map((category) => { const Icon = departmentIcon(category.key); return <Link key={category.key} to={`/shop?category=${encodeURIComponent(category.key)}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-primary hover:shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-xl text-brand-primary"><Icon/></span><span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{category.label}</span><span className="mt-1 block text-xs text-slate-500">{category.count ? `${category.count} products` : "Explore products"}</span></span></Link>; })}
            {plannedDepartments.filter((department) => !categoryCards.some((category) => department.match.test(category.key))).map(({ key, label, Icon }) => <div key={key} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-xl text-slate-400"><Icon/></span><span><span className="block text-sm font-medium text-slate-600">{label}</span><span className="mt-1 block text-xs text-slate-400">Coming soon</span></span></div>)}
          </div>
        </section>

        {heroProducts.length > 0 && <section className="mx-auto max-w-[1400px] px-5 pb-8 md:px-8" aria-label="Featured products"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-slate-950">Featured products</h2><Link to="/shop?sort=newest" className="text-sm font-semibold text-brand-primary">New arrivals <FiArrowRight className="ml-1 inline"/></Link></div><Swiper modules={[Navigation]} navigation spaceBetween={16} slidesPerView={1.3} breakpoints={{520:{slidesPerView:2.2},768:{slidesPerView:3},1100:{slidesPerView:4}}} className="commerce-slider catalogue-slider">{heroProducts.map((product) => <SwiperSlide key={product._id}><ProductCard product={product} onWishlist={addToWishlist}/></SwiperSlide>)}</Swiper></section>}

        {sponsored.length > 0 && <section className="border-y border-slate-200 bg-white"><div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow">Sponsored</p><h2 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">Promoted by our sellers</h2></div><p className="max-w-md text-right text-xs leading-5 text-slate-500">Paid placements are reviewed by Tamanna&apos;s Hut. Sponsorship does not change product reviews.</p></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{sponsored.map((item) => <ProductCard key={item.campaignId} product={item.product} campaignId={item.campaignId} onWishlist={addToWishlist}/>)}</div></div></section>}

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1400px] gap-px bg-slate-200 md:grid-cols-3">
            {[[FiShield,"Secure payments","Protected checkout with trusted payment methods."],[FiTruck,"Reliable delivery","Clear order updates from purchase to delivery."],[FiRefreshCw,"Easy returns","Simple support when an item is not quite right."]].map(([Icon,title,copy]) => (
              <div key={title} className="flex gap-4 bg-white px-8 py-8"><Icon className="mt-1 text-xl text-[#183d2b]"/><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p></div></div>
            ))}
          </div>
        </section>

        {(products.length > 6 || !heroProducts.length) && <section className="mx-auto max-w-[1400px] px-5 py-14 sm:py-20 md:px-8">
          <div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Fresh from the catalogue</p><h2 className="mt-3 text-2xl font-bold md:text-3xl">Latest products</h2></div><Link to="/shop" className="hidden font-semibold text-[#183d2b] sm:block">Shop all</Link></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? Array.from({ length: 8 }, (_, index) => <SkeletonProduct key={index} />) : products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} onWishlist={addToWishlist} />)}
          </div>
          {!loading && products.length === 0 && <div className="surface-card mt-10 px-5 py-16 text-center"><h3 className="text-xl font-semibold">{loadError ? "The catalogue is taking longer than expected" : "The catalogue is being prepared"}</h3><p className="mt-2 text-slate-500">{loadError ? "Please retry while we reconnect to the store." : "New products will appear here as soon as they are published."}</p>{loadError && <button type="button" onClick={() => { setLoading(true); setLoadError(false); setReloadKey((value) => value + 1); }} className="btn-primary mt-5">Try again</button>}</div>}
        </section>}

        <section className="bg-[#183d2b] text-white">
          <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-8">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Need help choosing?</p><h2 className="mt-3 text-2xl font-bold">Talk to our team before you order.</h2><p className="mt-3 text-white/70">Product details, availability or delivery—we&apos;re happy to help.</p></div>
            <Link to="/contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#183d2b]">Contact us <FiArrowRight /></Link>
          </div>
        </section>
        {instagramPosts.length > 0 && <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-400 text-2xl text-white"><FaInstagram /></span><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">From our Instagram</p><h2 className="mt-1 text-2xl font-bold text-slate-950">@tamannashut</h2><p className="mt-1 text-sm text-slate-500">New launches, styling ideas and real product updates.</p></div></div><a href="https://www.instagram.com/tamannashut" target="_blank" rel="noreferrer" className="btn-secondary shrink-0">View profile <FiExternalLink /></a></div>
            {instagramPosts.length > 0 ? <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} spaceBetween={16} slidesPerView={1.25} breakpoints={{ 520: { slidesPerView: 2.2 }, 768: { slidesPerView: 3.2 }, 1100: { slidesPerView: 4.2 } }} className="commerce-slider instagram-slider mt-9 pb-10">{instagramPosts.map((post) => <SwiperSlide key={post.id}><a href={post.permalink} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-square overflow-hidden bg-slate-100"><img src={post.mediaUrl} alt={post.caption || "Tamanna's Hut Instagram post"} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div><div className="p-4"><p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{post.caption || "View this post on Instagram"}</p><span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-primary"><FaInstagram/> View post</span></div></a></SwiperSlide>)}</Swiper> : <div className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-[#f8f7f3] px-6 py-10 text-center"><p className="font-semibold text-slate-800">Our Instagram gallery is being connected</p><p className="mt-2 text-sm text-slate-500">Until then, visit our official profile for the latest posts.</p><a href="https://www.instagram.com/tamannashut" target="_blank" rel="noreferrer" className="btn-secondary mt-5">Open Instagram <FiExternalLink /></a></div>}
          </div>
        </section>}
      </main>
    </>
  );
}

export default Home;
