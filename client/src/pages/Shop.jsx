import StoreMetrics from "../components/StoreMetrics";
import StoreIdentity from "../components/StoreIdentity";
import FollowStore from "../components/FollowStore";
import ProductRating from "../components/ProductRating";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ProductImageSlider from "../components/ProductImageSlider";
import SkeletonProduct from "../components/SkeletonProduct";
import { FiFilter, FiX } from "react-icons/fi";
import { trackEvent } from "../utils/analytics";
import { productPath } from "../utils/productUrl";
import { isCanceledRequest } from "../utils/retryRequest";
import { getProducts } from "../api/productApi";
import { useReloadOnPageResume } from "../utils/useReloadOnPageResume";

function Shop() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [storeUnavailable, setStoreUnavailable] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadPhase, setLoadPhase] = useState("loading");
  const [error, setError] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ colors: [], fabrics: [], ageGroups: [], price: { min: 0, max: 0 } });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("exact");
  const [sponsored, setSponsored] = useState([]);

  const categories = [{ label: "All", value: "" }, ...[...new Set([...(filterOptions.categories || []), ...products.map((product) => product.category), searchParams.get("category")].filter(Boolean))].sort().map((value) => ({ value, label: value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }))];
  const category = searchParams.get("category") || "";
  const selectedSize = searchParams.get("size") || "";
  const sort = searchParams.get("sort") || "newest";
  const inStock = searchParams.get("inStock") === "true";
  const color = searchParams.get("color") || "";
  const fabric = searchParams.get("fabric") || "";
  const ageGroup = searchParams.get("ageGroup") || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const queryString = searchParams.toString();
  const apiBase = import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL;

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setLoadPhase("loading");
      setError("");
      try {
        const params = Object.fromEntries(new URLSearchParams(queryString).entries());
        const { data } = await getProducts(
          { ...params, limit: 12, ...(storeId ? { store: storeId } : {}) },
          { signal: controller.signal, onRetry: () => setLoadPhase("waking") }
        );
        setStore(data.store || null); setStoreUnavailable(false);
        setProducts(data.products || []);
        setTotalProducts(data.totalProducts ?? data.products?.length ?? 0);
        setTotalPages(Math.max(data.totalPages || 1, 1));
        setSearchMode(data.searchMode || "exact");
        const responseProducts = data.products || [];
        const responseSizes = data.availableSizes?.length ? data.availableSizes : [...new Set(responseProducts.flatMap((product) => [...(product.variants || []), ...(product.sizeStock || [])].map((item) => item.size).filter(Boolean)))];
        setAvailableSizes(responseSizes);
        if (data.filterOptions) setFilterOptions(data.filterOptions);
        if (params.search) trackEvent("view_search_results", { search_term: params.search, result_count: data.totalProducts ?? data.products?.length ?? 0 });
      } catch (requestError) {
        if (!isCanceledRequest(requestError)) {
          if (storeId && requestError.response?.status === 404) { setStoreUnavailable(true); setStore(null); setProducts([]); setTotalProducts(0); }
          console.error(requestError);
          setError(navigator.onLine
            ? "The store is taking longer than expected to respond. Please try again."
            : "You appear to be offline. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadPhase("idle");
        }
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [queryString, reloadKey, storeId]);

  useReloadOnPageResume(setReloadKey);

  useEffect(() => { if (storeId) return undefined; let active = true; axios.get(`${apiBase}/api/ads/placements/shop`, { timeout: 12000 }).then(({ data }) => { if (active) setSponsored(data.campaigns || []); }).catch(() => {}); return () => { active = false; }; }, [apiBase, storeId]);

  useEffect(() => { if (!filtersOpen) return undefined; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [filtersOpen]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === false || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in updates)) next.delete("page");
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParams({ search: String(formData.get("search") || "").trim() });
  };

  const applyPrice = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const minPrice = String(formData.get("minPrice") || "");
    const maxPrice = String(formData.get("maxPrice") || "");
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }
    updateParams({ minPrice, maxPrice });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <>
      <Helmet>
        <title>{storeId ? `${store?.name || "Store"} | Tamanna's Hut` : "Shop All Products | Tamanna's Hut"}</title>
        <meta name="description" content={store ? `Shop all available products from ${store.name} on Tamanna's Hut.` : "Explore products across every published category in our growing catalogue."} />
        <link rel="canonical" href={`https://www.tamannashut.com${store?.path || (storeId ? `/store/${storeId}` : "/shop")}`} />
      </Helmet>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        {storeId && <nav aria-label="Store navigation" className="mb-6 flex items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-brand-primary">Home</Link><span aria-hidden="true">/</span><Link to="/shop" className="hover:text-brand-primary">Shop all</Link><span aria-hidden="true">/</span><span className="font-medium text-slate-700">{store?.name || "Store"}</span></nav>}
        {store && <section aria-label="Store profile" className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-center gap-5"><StoreIdentity store={store} large /><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[2px] text-brand-primary">Brand store</p><h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-4xl">{store.name}</h1><p className="mt-2 text-sm text-slate-500">{store.productCount ?? totalProducts} products · Explore the collection</p><StoreMetrics store={store} /></div><FollowStore key={store.id} store={store} /></div><div className="mt-6 flex gap-6 border-t border-slate-100 pt-4 text-sm"><span className="border-b-2 border-brand-primary pb-2 font-semibold text-brand-primary">All products</span><Link to="/shop" className="pb-2 text-slate-500 hover:text-brand-primary">Browse marketplace</Link></div></section>}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            {!storeId && <p className="text-sm font-medium uppercase tracking-[3px] text-brand-primary">Tamanna's Hut collection</p>}
            {!store && <h1 className="mt-2 text-3xl font-bold sm:text-4xl md:text-5xl">{storeId ? storeUnavailable ? "Store unavailable" : "Loading store…" : "Find their perfect outfit"}</h1>}
            <p className="mt-3 text-gray-500">{loading ? (loadPhase === "waking" ? "Waking up the store…" : "Finding products…") : `${totalProducts} products found`}</p>
            {!loading && searchMode === "fuzzy" && searchParams.get("search") && <p className="mt-2 text-sm font-medium text-amber-700">Showing close matches for “{searchParams.get("search")}”.</p>}
          </div>

          <form key={`search-${searchParams.get("search") || ""}`} onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
            <input
              name="search"
              type="search"
              defaultValue={searchParams.get("search") || ""}
              placeholder={storeId ? "Search this store" : "Search dresses, sets and more"}
              className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 outline-none focus:border-brand-primary"
            />
            <button className="rounded-xl bg-brand-primary px-5 py-3 font-medium text-white">Search</button>
          </form>
        </div>

        <div className="mt-6 lg:hidden">
          <button type="button" onClick={() => setFiltersOpen(true)} className="btn-secondary w-full"><FiFilter/> Filters & sorting</button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
          {filtersOpen && <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="fixed inset-0 z-[70] bg-slate-950/45 lg:hidden"/>}
          <aside className={`${filtersOpen ? "fixed inset-y-0 left-0 z-[80] block h-dvh w-[min(88vw,360px)] overflow-y-auto overscroll-contain rounded-none pb-[max(1.25rem,env(safe-area-inset-bottom))]" : "hidden"} border bg-white p-5 shadow-xl lg:sticky lg:top-24 lg:block lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:w-auto lg:overflow-y-auto lg:overscroll-contain lg:rounded-3xl lg:shadow-sm`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filters</h2>
              <div className="flex items-center gap-3">{queryString && <button onClick={clearFilters} className="text-sm text-brand-primary underline">Clear all</button>}<button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full border lg:hidden"><FiX/></button></div>
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="font-medium">Category</h3>
              <div className="mt-3 space-y-2">
                {categories.map((item) => (
                  <label key={item.label} className="flex cursor-pointer items-center gap-3">
                    <input type="radio" name="category" checked={category === item.value} onChange={() => updateParams({ category: item.value })} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t pt-5">
              <label className="text-sm font-medium">Colour<select value={color} onChange={(event) => updateParams({ color: event.target.value })} className="mt-2 w-full rounded-xl border p-3"><option value="">All colours</option>{filterOptions.colors.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm font-medium">Fabric<select value={fabric} onChange={(event) => updateParams({ fabric: event.target.value })} className="mt-2 w-full rounded-xl border p-3"><option value="">All fabrics</option>{filterOptions.fabrics.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm font-medium">Age group<select value={ageGroup} onChange={(event) => updateParams({ ageGroup: event.target.value })} className="mt-2 w-full rounded-xl border p-3"><option value="">All age groups</option>{filterOptions.ageGroups.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="font-medium">Product option</h3>
              <select value={selectedSize} onChange={(event) => updateParams({ size: event.target.value })} className="mt-3 w-full rounded-xl border p-3">
                <option value="">All options</option>
                {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>

            <form key={`price-${searchParams.get("minPrice") || ""}-${searchParams.get("maxPrice") || ""}`} onSubmit={applyPrice} className="mt-6 border-t pt-5">
              <h3 className="font-medium">Price range</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input name="minPrice" type="number" min="0" defaultValue={searchParams.get("minPrice") || ""} placeholder="Min ₹" className="min-w-0 rounded-xl border p-2.5" />
                <input name="maxPrice" type="number" min="0" defaultValue={searchParams.get("maxPrice") || ""} placeholder="Max ₹" className="min-w-0 rounded-xl border p-2.5" />
              </div>
              <button className="mt-3 w-full rounded-xl border border-brand-primary py-2 text-brand-primary">Apply price</button>
              {filterOptions.price?.max > 0 && <p className="mt-2 text-xs text-slate-400">Catalogue range: ₹{Number(filterOptions.price.min || 0).toLocaleString("en-IN")}–₹{Number(filterOptions.price.max || 0).toLocaleString("en-IN")}</p>}
            </form>

            <label className="mt-6 flex cursor-pointer items-center gap-3 border-t pt-5">
              <input type="checkbox" checked={inStock} onChange={(event) => updateParams({ inStock: event.target.checked })} />
              <span>In stock only</span>
            </label>
          </aside>

          <section>
            {sponsored.length > 0 && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-800">Sponsored listings</p><p className="mt-1 text-xs text-slate-500">Paid placements reviewed by Tamanna&apos;s Hut.</p></div></div><div className="mt-4 flex gap-4 overflow-x-auto pb-2">{sponsored.map((item) => <Link key={item.campaignId} to={productPath(item.product)} onClick={() => axios.post(`${import.meta.env.VITE_API_URL}/api/ads/${item.campaignId}/click`).catch(() => {})} className="flex min-w-[260px] gap-3 rounded-xl border bg-white p-3"><img src={item.product.images?.[0]?.url} alt="" className="h-20 w-16 rounded-lg object-cover"/><div><p className="line-clamp-2 text-sm font-semibold">{item.product.name}</p><p className="mt-2 font-bold text-brand-primary">₹{Number(item.product.price).toLocaleString("en-IN")}</p><span className="text-[10px] uppercase tracking-wider text-slate-400">Sponsored</span></div></Link>)}</div></div>}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <label className="flex items-center gap-3 text-sm">
                Sort by
                <select value={sort} onChange={(event) => updateParams({ sort: event.target.value })} className="rounded-xl border px-3 py-2">
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="rating">Customer rating</option>
                </select>
              </label>
            </div>

            {storeUnavailable && <div role="alert" className="mb-6 rounded-2xl border bg-white p-6"><p>This store is not currently available. Browse the rest of the catalogue while its listings are being updated.</p><Link to="/shop" className="btn-primary mt-4">Shop all products</Link></div>}
            {error && !storeUnavailable && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-red-700"><span>{error}</span><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold">Try again</button></div>}

            {loading && loadPhase === "waking" && <div role="status" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">The store is waking up</p><p className="mt-1">This can take about a minute after a quiet period. We will reconnect automatically—there is no need to reload the page.</p></div>}

            <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <SkeletonProduct key={index} />)
                : products.map((product) => {
                    const stock = product.variants?.length ? product.variants.filter((item) => item.active !== false).reduce((total, item) => total + Number(item.stock || 0), 0) : product.sizeStock?.length ? product.sizeStock.reduce((total, item) => total + Number(item.stock || 0), 0) : Number(product.stock || 0);
                    return (
                      <article key={product._id} className="group overflow-hidden rounded-3xl border bg-white transition hover:shadow-xl">
                        <ProductImageSlider product={product} className="aspect-[2/3]" />
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="font-medium capitalize text-brand-primary">{product.category?.replace(/-/g, " ")}</p>
                            <p className={stock > 0 ? "text-green-700" : "text-red-600"}>{stock > 0 ? "In stock" : "Out of stock"}</p>
                          </div>
                          <h2 className="mt-2 line-clamp-2 text-xl font-bold">{product.name}</h2>
                          <div className="mt-3 flex items-center justify-between">
                            <div><p className="text-xl font-bold text-brand-primary">₹{Number(product.price).toLocaleString("en-IN")}</p>{Number(product.mrp) > Number(product.price) && <p className="text-xs text-gray-400"><span className="line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span><span className="ml-1 font-semibold text-green-700">{Math.round((1 - Number(product.price) / Number(product.mrp)) * 100)}% off</span></p>}</div>
                            <ProductRating product={product} />
                          </div>
                          <Link to={productPath(product)} className="mt-5 block rounded-full bg-brand-primary py-3 text-center font-medium text-white transition hover:bg-[#2d4d33]">View product</Link>
                        </div>
                      </article>
                    );
                  })}
            </div>

            {!loading && products.length === 0 && !storeUnavailable && (
              <div className="rounded-3xl border bg-white px-6 py-16 text-center">
                <h2 className="text-2xl font-semibold">No matching products</h2>
                <p className="mt-2 text-gray-500">Try removing a filter or searching for something else.</p>
                <button onClick={clearFilters} className="mt-5 rounded-xl bg-brand-primary px-5 py-3 text-white">View all products</button>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <nav aria-label="Product pages" className="mt-10 flex items-center justify-center gap-3">
                <button disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })} className="rounded-xl border bg-white px-5 py-3 disabled:opacity-40">Previous</button>
                <span className="px-3 text-sm">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => updateParams({ page: page + 1 })} className="rounded-xl border bg-white px-5 py-3 disabled:opacity-40">Next</button>
              </nav>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default Shop;
