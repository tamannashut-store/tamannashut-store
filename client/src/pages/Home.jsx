import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiArrowRight, FiExternalLink, FiHeart, FiRefreshCw, FiTruck, FiGrid, FiHome, FiMonitor, FiShoppingBag, FiBookOpen, FiActivity, FiSmile } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { getProducts } from "../api/productApi";
import WishlistContext from "../context/wishlistState";
import ProductRating from "../components/ProductRating";
import ProductImageSlider from "../components/ProductImageSlider";
import ProductEditorialImages from "../components/ProductEditorialImages";
import HomeProductHero from "../components/HomeProductHero";
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
        <ProductImageSlider product={product} className="aspect-[2/3]" />
        <button type="button" onClick={() => onWishlist(product)} aria-label={`Save ${product.name}`} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:text-brand-primary">
          <FiHeart />
        </button>
        {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#183d2b] px-3 py-1 text-xs font-semibold text-white">{discount}% off</span>}
        {campaignId && <span className="absolute bottom-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">Sponsored</span>}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{String(product.category || "Products").replace("-", " ")}</p>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{product.name}</h3><ProductRating product={product} className="mt-2" />
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
  const spotlightProducts = [...products].filter((item) => !item.status || item.status === "active").sort((a, b) => Number(b.approvedReviewCount || 0) - Number(a.approvedReviewCount || 0)).slice(0, 6);
  const valueProduct = products.filter((product) => Number(product.mrp) > Number(product.price)).sort((a, b) => (1 - Number(b.price) / Number(b.mrp)) - (1 - Number(a.price) / Number(a.mrp)))[0];

  return (
    <>
      <Helmet>
        <title>Tamanna&apos;s Hut | Discover Your Everyday</title>
        <meta name="description" content="Discover products across our growing catalogue at Tamanna's Hut. Shop securely and track every order." />
        <link rel="canonical" href="https://www.tamannashut.com/" />
      </Helmet>

      <main className="bg-[#f5f7fa]">
        <HomeProductHero products={spotlightProducts} loading={loading} search={homeSearch} setSearch={setHomeSearch} onSearch={(event) => { event.preventDefault(); navigate(homeSearch.trim() ? "/shop?search=" + encodeURIComponent(homeSearch.trim()) : "/shop"); }} />
        <section id="departments" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-12 md:px-8 lg:py-16" aria-label="Departments">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">A growing world of choice</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Shop by department</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Explore what&apos;s available today and see where our store is growing next.</p></div><Link to="/shop" className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-brand-primary sm:inline-flex">Browse all <FiArrowRight /></Link></div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {categoryCards.map((category) => { const Icon = departmentIcon(category.key); return <Link key={category.key} to={"/shop?category=" + encodeURIComponent(category.key)} className="group flex min-h-48 flex-col items-center justify-center rounded-2xl border border-[#dde6d9] bg-white px-3 py-6 text-center transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-lg"><span className="grid h-20 w-20 place-items-center rounded-full bg-[#eaf1e4] text-4xl text-brand-primary transition group-hover:scale-105"><Icon/></span><span className="mt-4 block text-sm font-bold text-slate-900">{category.label}</span><span className="mt-1 block text-xs text-brand-primary">{category.count ? category.count + " products" : "Explore products"}</span></Link>; })}
            {plannedDepartments.filter((department) => !categoryCards.some((category) => department.match.test(category.key))).map(({ key, label, Icon }, index) => <div key={key} className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-white bg-white px-3 py-6 text-center"><span style={{backgroundColor:["#f6eadf","#e6edf3","#f6e4e8","#e9eadb","#e9e4f3"][index % 5]}} className="grid h-20 w-20 place-items-center rounded-full text-4xl text-[#586453]"><Icon/></span><span className="mt-4 block text-sm font-semibold text-slate-700">{label}</span><span className="mt-2 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Coming soon</span></div>)}
          </div>
        </section>

        {heroProducts.length > 0 && <section className="mx-auto max-w-[1400px] px-5 pb-14 md:px-8 lg:pb-16" aria-label="Featured products"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Available to shop now</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Featured products</h2><p className="mt-2 text-sm text-slate-500">Take a closer look at our current collection.</p></div><Link to="/shop?sort=newest" className="text-sm font-semibold text-brand-primary">New arrivals <FiArrowRight className="ml-1 inline"/></Link></div><Swiper modules={[Navigation]} navigation spaceBetween={16} slidesPerView={1.3} breakpoints={{520:{slidesPerView:2.2},768:{slidesPerView:3},1100:{slidesPerView:4}}} className="commerce-slider catalogue-slider">{heroProducts.map((product) => <SwiperSlide key={product._id}><ProductCard product={product} onWishlist={addToWishlist}/></SwiperSlide>)}</Swiper></section>}

        <section className="border-y border-[#e5e4dc] bg-[#f1eee5]" aria-label="Shop by budget"><div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 lg:py-16"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Find your kind of value</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good finds. Within your budget.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Start with a price that works for you. Browse the catalogue with your budget already selected.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3">{[[499,"Little everyday finds","For the small things that make your day.","#e7edde"],[999,"More room to explore","Discover more without stretching your budget.","#eee3d6"],[1499,"Something a little extra","Find a treat for yourself or someone you love.","#e5e7ef"]].map(([limit,title,copy,color]) => <Link key={limit} to={"/shop?maxPrice=" + limit} style={{backgroundColor:color}} className="group relative overflow-hidden rounded-2xl border border-white/60 p-6 transition hover:-translate-y-1 hover:shadow-lg sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">{title}</p><p className="mt-5 text-3xl font-bold tracking-tight text-[#183d2b]">Under ₹{Number(limit).toLocaleString("en-IN")}</p><p className="mt-3 max-w-64 text-sm leading-6 text-slate-600">{copy}</p><span className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#183d2b]">Explore finds <FiArrowRight className="transition group-hover:translate-x-1"/></span><FiShoppingBag aria-hidden="true" className="absolute -bottom-4 -right-3 text-[110px] text-white/35"/></Link>)}</div></div></section>

        {products.length > 1 && valueProduct && <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 lg:py-16" aria-label="Value spotlight"><div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2"><div className="flex flex-col justify-center px-6 py-9 sm:p-10 lg:p-12"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">A closer look</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A find worth discovering.</h2><p className="mt-5 text-lg font-semibold text-slate-700">{valueProduct.name}</p><ProductRating product={valueProduct} className="mt-3" /><div className="mt-5 flex items-baseline gap-3"><span className="text-3xl font-bold text-[#183d2b]">₹{Number(valueProduct.price).toLocaleString("en-IN")}</span><span className="text-lg text-slate-500 line-through">₹{Number(valueProduct.mrp).toLocaleString("en-IN")}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{Math.round((1-Number(valueProduct.price)/Number(valueProduct.mrp))*100)}% off</span></div><p className="mt-5 max-w-md text-sm leading-7 text-slate-500">See the full photos, check product details and choose the option that works for you before adding it to your bag.</p><Link to={productPath(valueProduct)} className="btn-primary mt-7 w-fit gap-2">Discover this product <FiArrowRight/></Link></div><div className="min-w-0 self-center"><ProductEditorialImages product={valueProduct} /></div></div></section>}

        {sponsored.length > 0 && <section className="border-y border-slate-200 bg-white"><div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow">Sponsored</p><h2 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">Promoted by our sellers</h2></div><p className="max-w-md text-right text-xs leading-5 text-slate-500">Paid placements are reviewed by Tamanna&apos;s Hut. Sponsorship does not change product reviews.</p></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{sponsored.map((item) => <ProductCard key={item.campaignId} product={item.product} campaignId={item.campaignId} onWishlist={addToWishlist}/>)}</div></div></section>}

        {(products.length > 6 || !heroProducts.length) && <section className="mx-auto max-w-[1400px] px-5 py-14 sm:py-20 md:px-8">
          <div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Fresh from the catalogue</p><h2 className="mt-3 text-2xl font-bold md:text-3xl">Latest products</h2></div><Link to="/shop" className="hidden font-semibold text-[#183d2b] sm:block">Shop all</Link></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? Array.from({ length: 8 }, (_, index) => <SkeletonProduct key={index} />) : products.slice(6, 12).map((product) => <ProductCard key={product._id} product={product} onWishlist={addToWishlist} />)}
          </div>
          {!loading && products.length === 0 && <div className="surface-card mt-10 px-5 py-16 text-center"><h3 className="text-xl font-semibold">{loadError ? "The catalogue is taking longer than expected" : "The catalogue is being prepared"}</h3><p className="mt-2 text-slate-500">{loadError ? "Please retry while we reconnect to the store." : "New products will appear here as soon as they are published."}</p>{loadError && <button type="button" onClick={() => { setLoading(true); setLoadError(false); setReloadKey((value) => value + 1); }} className="btn-primary mt-5">Try again</button>}</div>}
        </section>}

        <section className="mx-auto max-w-[1400px] px-5 py-14 md:px-8 lg:py-16" aria-label="Shopping support"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">From your first click to your doorstep</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Shopping made straightforward.</h2><p className="mt-3 text-sm leading-7 text-slate-500">Your account keeps the important things together. Find support and manage your order whenever you need to.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["01",FiShoppingBag,"Find your next favourite","Browse products, compare details and save the things you like.","/shop","Explore the catalogue"],["02",FiHeart,"Keep a little wish list","Save your favourites so they are easy to find when you return.","/wishlist","See your favourites"],["03",FiTruck,"Follow your order","Check order status and delivery updates from your account.","/my-orders","Track your orders"],["04",FiRefreshCw,"Get help after delivery","Find return instructions, refund information and customer support.","/return-policy","Read the return policy"]].map(([number,Icon,title,copy,url,label]) => <Link key={number} to={url} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-primary hover:shadow-md"><div className="flex items-center justify-between"><Icon className="text-2xl text-brand-primary"/><span className="text-xs font-semibold text-slate-400">{number}</span></div><h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{copy}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-brand-primary">{label}<FiArrowRight/></span></Link>)}</div></section>

        <section className="px-5 pb-14 md:px-8 lg:pb-16" aria-label="Sell with us"><div className="mx-auto grid max-w-[1400px] gap-8 overflow-hidden rounded-3xl bg-[#183d2b] p-7 text-white sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-12"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bccc9f]">Grow with Tamanna&apos;s Hut</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Your products. A new place to sell.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-white/75">Bring your business to our growing marketplace. Applications are open, with business verification and administrator approval before you start selling.</p><Link to="/seller/register" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#e6edce] px-6 py-3.5 text-sm font-bold text-[#183d2b]">Apply to become a seller <FiArrowRight/></Link></div><div className="grid gap-3">{[["1","Apply online","Use your account and submit your business details."],["2","Complete verification","We review your business and settlement information."],["3","Start selling after approval","Manage your catalogue and orders in Seller Centre."]].map(([number,title,copy]) => <div key={number} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-[#e6edce]">{number}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-white/65">{copy}</p></div></div>)}</div></div></section>

        <section className="border-t border-[#e5e4dc] bg-[#eeeadd] text-[#183d2b]">
          <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-8">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Need help choosing?</p><h2 className="mt-3 text-2xl font-bold">Talk to our team before you order.</h2><p className="mt-3 text-slate-600">Product details, availability or delivery—we&apos;re happy to help.</p></div>
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
