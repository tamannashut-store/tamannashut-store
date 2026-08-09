import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiArrowRight, FiHeart, FiRefreshCw, FiShield, FiTruck } from "react-icons/fi";
import { getProducts } from "../api/productApi";
import { WishlistContext } from "../context/WishlistContext";
import ProductImageSlider from "../components/ProductImageSlider";
import SkeletonProduct from "../components/SkeletonProduct";

const categories = [
  { key: "girls", label: "Girls", copy: "Dresses and sets for celebrations and everyday moments." },
  { key: "boys", label: "Boys", copy: "Comfortable, polished styles made for active days." },
  { key: "new-arrivals", label: "New arrivals", copy: "The newest pieces added to our growing collection." },
];

function ProductCard({ product, onWishlist }) {
  const mrp = Number(product.mrp || product.price);
  const price = Number(product.price);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <ProductImageSlider product={product} className="h-72" />
        <button type="button" onClick={() => onWishlist(product)} aria-label={`Save ${product.name}`} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:text-brand-primary">
          <FiHeart />
        </button>
        {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#183d2b] px-3 py-1 text-xs font-semibold text-white">{discount}% off</span>}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{String(product.category || "Kidswear").replace("-", " ")}</p>
        <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-semibold text-slate-900">{product.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-[#183d2b]">₹{price.toLocaleString("en-IN")}</span>
          {mrp > price && <span className="text-sm text-slate-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
        <Link to={`/product/${product._id}`} className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-[#183d2b]">
          View details <FiArrowRight />
        </Link>
      </div>
    </article>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist } = useContext(WishlistContext);

  useEffect(() => {
    let active = true;
    getProducts({ limit: 12 })
      .then(({ data }) => { if (active) setProducts(Array.isArray(data) ? data : data.products || []); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categoryCards = useMemo(() => categories.map((category) => ({
    ...category,
    image: products.find((product) => product.category === category.key)?.images?.[0]?.url || null,
  })), [products]);
  const heroProduct = products[0];

  return (
    <>
      <Helmet>
        <title>Tamanna&apos;s Hut | Premium Kidswear</title>
        <meta name="description" content="Shop thoughtfully selected kidswear for girls and boys at Tamanna's Hut." />
        <link rel="canonical" href="https://tamannashut.com/" />
      </Helmet>

      <main className="bg-[#f8f7f3]">
        <section className="border-b border-[#e7e3da]">
          <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
            <div className="max-w-xl py-6">
              <p className="eyebrow">New season · Thoughtful essentials</p>
              <h1 className="mt-5 font-serif text-5xl leading-[1.04] text-slate-950 md:text-6xl lg:text-7xl">Beautiful clothes for their biggest little moments.</h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Comfort-first kidswear selected for quality, easy movement and celebrations worth remembering.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="btn-primary">Shop the collection <FiArrowRight /></Link>
                <Link to="/shop?category=new-arrivals" className="btn-secondary">See what&apos;s new</Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <span>Secure checkout</span><span>Easy returns</span><span>India-wide delivery</span>
              </div>
            </div>
            <Link to={heroProduct ? `/product/${heroProduct._id}` : "/shop"} className="relative block min-h-[480px] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_75%_25%,#dce9df_0,#c4d7c9_28%,#8dab96_65%,#52705b_100%)] lg:min-h-[620px]">
              {heroProduct?.images?.[0]?.url && <img src={heroProduct.images[0].url} alt={heroProduct.name} className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">Featured now</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">{heroProduct?.name || "Explore our latest collection"}</h2>
                {heroProduct && <p className="mt-2 text-lg">From ₹{Number(heroProduct.price).toLocaleString("en-IN")}</p>}
              </div>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="eyebrow">Shop their world</p><h2 className="mt-3 font-serif text-4xl text-slate-950 md:text-5xl">Made for every moment</h2></div>
            <Link to="/shop" className="inline-flex items-center gap-2 font-semibold text-[#183d2b]">View all products <FiArrowRight /></Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {categoryCards.map((category) => (
              <Link key={category.key} to={`/shop?category=${category.key}`} className="group relative min-h-[420px] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#dbe8dd,#879e8d)]">
                {category.image && <img src={category.image} alt={`${category.label} collection`} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white"><h3 className="font-serif text-3xl">{category.label}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-white/80">{category.copy}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1400px] gap-px bg-slate-200 md:grid-cols-3">
            {[[FiShield,"Secure payments","Protected checkout with trusted payment methods."],[FiTruck,"Reliable delivery","Clear order updates from purchase to delivery."],[FiRefreshCw,"Easy returns","Simple support when an item is not quite right."]].map(([Icon,title,copy]) => (
              <div key={title} className="flex gap-4 bg-white px-8 py-8"><Icon className="mt-1 text-xl text-[#183d2b]"/><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p></div></div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Fresh from the catalogue</p><h2 className="mt-3 font-serif text-4xl md:text-5xl">Latest products</h2></div><Link to="/shop" className="hidden font-semibold text-[#183d2b] sm:block">Shop all</Link></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? Array.from({ length: 8 }, (_, index) => <SkeletonProduct key={index} />) : products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} onWishlist={addToWishlist} />)}
          </div>
          {!loading && products.length === 0 && <div className="surface-card mt-10 py-16 text-center"><h3 className="text-xl font-semibold">The catalogue is being prepared</h3><p className="mt-2 text-slate-500">New products will appear here as soon as they are published.</p></div>}
        </section>

        <section className="bg-[#183d2b] text-white">
          <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-8">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Need help choosing?</p><h2 className="mt-3 font-serif text-4xl">Talk to our team before you order.</h2><p className="mt-3 text-white/70">Sizing, availability or delivery—we&apos;re happy to help.</p></div>
            <Link to="/contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#183d2b]">Contact us <FiArrowRight /></Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
