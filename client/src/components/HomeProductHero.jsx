import { Link } from "react-router-dom";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import ProductRating from "./ProductRating";
import { optimizedImage } from "../utils/image";
import { productPath } from "../utils/productUrl";

export default function HomeProductHero({ products, loading, search, setSearch, onSearch }) {
  return (
    <section className="border-b border-[#e6e2d7] bg-[#f6f3ec] px-5 py-7 md:px-8 lg:py-10" aria-label="Marketplace introduction">
      <div className="mx-auto grid max-w-[1280px] items-center gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="py-3 lg:py-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Welcome to Tamanna&apos;s Hut</p>
          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-[1.1] tracking-tight text-[#183d2b] sm:text-5xl">Discover something<br />you&apos;ll love.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600">Explore our latest arrivals. Choose your colour, find your fit and shop with confidence.</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex gap-2 px-6 py-3">Shop the collection <FiArrowRight /></Link>
          <form role="search" aria-label="Find products" onSubmit={onSearch} className="mt-7 flex max-w-md items-center gap-2 rounded-xl border border-[#d9dfd4] bg-white p-1.5">
            <FiSearch className="ml-2 shrink-0 text-slate-400" />
            <input aria-label="Search products, brands and categories" placeholder="Search the store" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none" />
            <button type="submit" className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
          </form>
        </div>
        <section aria-label="Product spotlight" className="min-w-0 overflow-hidden rounded-2xl border border-[#e6e2d7] bg-white">
          {products.length ? <Swiper modules={[A11y, Keyboard, Navigation, Pagination]} keyboard={{ enabled: true, onlyInViewport: true }} navigation={products.length > 1} pagination={products.length > 1 ? { clickable: true } : false} className="commerce-slider">
            {products.map((product, index) => (
              <SwiperSlide key={product._id}>
                <article className="grid grid-cols-[1.1fr_0.9fr] sm:grid-cols-2">
                  <Link to={productPath(product)} aria-label={`Explore ${product.name}`} className="block aspect-[3/4] overflow-hidden bg-[#eeede6]">
                    <img src={optimizedImage(product.images?.[0]?.url || "/placeholder.png", 800)} alt={product.name} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-col justify-center px-4 py-7 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">In the spotlight</p>
                    <h2 className="mt-3 text-base font-semibold leading-6 text-slate-900 sm:text-xl sm:leading-7"><Link to={productPath(product)}>{product.name}</Link></h2>
                    <ProductRating product={product} className="mt-3" />
                    <p className="mt-5 text-xs text-slate-500">From</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2"><span className="text-2xl font-bold text-[#183d2b]">₹{Number(product.price).toLocaleString("en-IN")}</span>{Number(product.mrp) > Number(product.price) && <span className="text-xs text-slate-500 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span>}</div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">Choose your colour and size on the product page.</p>
                    <Link to={productPath(product)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">View product <FiArrowRight /></Link>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper> : <div className="flex min-h-64 items-center justify-center px-6 py-10 text-center"><p role={loading ? "status" : undefined}>{loading ? "Loading the latest arrivals…" : "Explore our collection in the shop."}</p></div>}
        </section>
      </div>
    </section>
  );
}
