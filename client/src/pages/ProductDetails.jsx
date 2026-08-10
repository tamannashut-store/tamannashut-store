import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ImageMagnifier from "../components/ImageMagnifier";

function ProductDetails() {
  const { id } = useParams();
  const { cartItems, addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user"))?.token ? { loading: true, eligible: false, reason: "" } : { loading: false, eligible: false, reason: "Log in to review products you have purchased" }; }
    catch { return { loading: false, eligible: false, reason: "Log in to review products you have purchased" }; }
  });

  const fetchProduct = useCallback(async (signal) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`, { signal });
      setProduct(data);
      setSelectedColor(data.variants?.find((variant) => variant.active !== false)?.color || data.color || "");
      setSelectedSize("");
      setSelectedImageIndex(0);
    } catch (error) {
      if (error.code !== "ERR_CANCELED") console.error(error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    // Fetching route data is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduct(controller.signal);
    return () => controller.abort();
  }, [fetchProduct]);

  useEffect(() => {
    let active = true;
    let user;
    try { user = JSON.parse(localStorage.getItem("user")); } catch { /* Invalid cached session is treated as signed out. */ }
    if (!user?.token) return undefined;
    axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}/review-eligibility`)
      .then(({ data }) => { if (active) setReviewEligibility({ loading: false, eligible: Boolean(data.eligible), reason: data.reason || "" }); })
      .catch((error) => { if (active) setReviewEligibility({ loading: false, eligible: false, reason: error.response?.data?.message || "Review eligibility could not be verified" }); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2">
        <Skeleton height={650} borderRadius={28} />
        <div><Skeleton width={150} /><Skeleton height={55} className="mt-5" /><Skeleton count={5} className="mt-5" /></div>
      </div>
    );
  }
  if (!product) return <div className="px-6 py-24 text-center text-xl">Product not found.</div>;

  const allImages = product.images?.length ? product.images : [{ url: "/placeholder.png", public_id: "placeholder", color: "" }];
  const colorOptions = [...new Set((product.variants || []).filter((item) => item.active !== false).map((item) => item.color).filter(Boolean))];
  const matchingColorImages = selectedColor ? allImages.filter((image) => image.color?.toLowerCase() === selectedColor.toLowerCase() && (!image.size || !selectedSize || image.size === selectedSize)) : [];
  const sharedImages = allImages.filter((image) => !image.color && (!image.size || !selectedSize || image.size === selectedSize));
  const colorImages = selectedColor ? [...matchingColorImages, ...sharedImages] : allImages;
  const images = colorImages.length ? colorImages : allImages;
  const availableVariants = (product.variants || []).filter((item) => item.active !== false && (!selectedColor || !item.color || item.color.toLowerCase() === selectedColor.toLowerCase()));
  const sizeOptions = availableVariants.length ? availableVariants : product.sizeStock || [];
  const selectedVariant = availableVariants.find((item) => item.size === selectedSize);
  const selectedSizeData = selectedVariant || product.sizeStock?.find((item) => item.size === selectedSize);
  const selectedPrice = Number(selectedVariant?.price ?? product.price);
  const cartQty = cartItems
    .filter((item) => item._id === product._id && item.selectedSize === selectedSize && (!selectedVariant?.sku || item.selectedSku === selectedVariant.sku))
    .reduce((sum, item) => sum + item.qty, 0);
  const availableStock = Math.max(Number(selectedSizeData?.stock || 0) - cartQty, 0);
  const totalStock = product.sizeStock?.reduce((sum, item) => sum + Number(item.stock || 0), 0) || 0;

  const submitReview = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return toast.error("Please log in to review this product");
    if (!comment.trim()) return toast.error("Write a short review first");
    try {
      setSubmittingReview(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${id}/review`, { rating: Number(rating), comment });
      toast.success("Thank you for your review");
      setComment("");
      setRating(5);
      await fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || "Review could not be submitted");
    } finally {
      setSubmittingReview(false);
    }
  };

  const addSelectedToCart = () => {
    if (!selectedSize) return toast.error("Please select a size");
    if (availableStock <= 0) return toast.error("This size is out of stock");
    addToCart({ ...product, price: selectedPrice, selectedSize, selectedColor, selectedSku: selectedVariant?.sku || "", image: images[0]?.url });
    toast.success("Added to your bag");
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} | Tamanna's Hut`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} | Tamanna's Hut`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={images[0].url} />
        <meta property="og:type" content="product" />
        <link rel="canonical" href={`https://www.tamannashut.com/product/${id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: images.map((image) => image.url),
            description: product.description,
            brand: { "@type": "Brand", name: "Tamanna's Hut" },
            offers: {
              "@type": "Offer",
              url: `https://www.tamannashut.com/product/${id}`,
              priceCurrency: "INR",
              price: product.price,
              availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            ...(product.reviews?.length ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(product.averageRating || 0).toFixed(1),
                reviewCount: product.reviews.length,
              },
            } : {}),
          })}
        </script>
      </Helmet>

      <main className="bg-brand-background pb-20">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-6">
          <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-brand-primary">Home</Link><span>/</span>
            <Link to="/shop" className="hover:text-brand-primary">Shop</Link><span>/</span>
            <span className="truncate text-gray-700">{product.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)] xl:gap-16">
            <section className="min-w-0">
              <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
                <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
                  {images.map((image, index) => (
                    <button key={image.public_id || index} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`View photo ${index + 1}`} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${selectedImageIndex === index ? "border-brand-primary" : "border-transparent hover:border-gray-300"}`}>
                      <img src={image.url} alt="" className="h-full w-full rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
                <div className="order-1 min-w-0 sm:order-2">
                  <div className="relative"><ImageMagnifier src={(images[selectedImageIndex] || images[0])?.url} alt={`${product.name} view ${selectedImageIndex + 1}`} />{images.length > 1 && <><button type="button" onClick={() => setSelectedImageIndex((current) => (current - 1 + images.length) % images.length)} className="gallery-arrow left-3" aria-label="Previous product image">‹</button><button type="button" onClick={() => setSelectedImageIndex((current) => (current + 1) % images.length)} className="gallery-arrow right-3" aria-label="Next product image">›</button></>} </div>
                  {images.length > 1 && <div className="mt-4 flex justify-center gap-2" aria-label="Product image position">{images.map((image, index) => <button key={`dot-${image.public_id || index}`} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`Show product image ${index + 1}`} className={`gallery-dot ${selectedImageIndex === index ? "gallery-dot-active" : ""}`} />)}</div>}
                </div>
              </div>
            </section>

            <section className="h-fit rounded-3xl border bg-white p-6 shadow-sm md:p-8 lg:sticky lg:top-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium uppercase tracking-[3px] text-brand-primary">{product.category?.replace(/-/g, " ")}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${totalStock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{totalStock > 0 ? "In stock" : "Out of stock"}</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-lg bg-green-700 px-2.5 py-1 text-sm font-semibold text-white">★ {Number(product.averageRating || 0).toFixed(1)}</span>
                <a href="#reviews" className="text-sm text-gray-500 underline">{product.reviews?.length || 0} reviews</a>
              </div>
              <div className="mt-6 flex flex-wrap items-end gap-3"><p className="text-4xl font-bold text-brand-primary">₹{selectedPrice.toLocaleString("en-IN")}</p>{Number(product.mrp) > selectedPrice && <><p className="pb-1 text-lg text-gray-400 line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</p><span className="mb-1 rounded-full bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">{Math.round((1 - selectedPrice / Number(product.mrp)) * 100)}% off</span></>}</div>
              <p className="mt-2 text-sm text-gray-500">Inclusive of all taxes</p>

              {colorOptions.length > 0 && <div className="mt-8 border-t pt-7"><div className="flex items-center justify-between"><h2 className="font-semibold">Choose colour</h2><span className="text-sm text-gray-500">{selectedColor}</span></div><div className="mt-4 flex flex-wrap gap-3">{colorOptions.map((color) => { const preview = allImages.find((image) => image.color?.toLowerCase() === color.toLowerCase()) || allImages[0]; return <button key={color} type="button" onClick={() => { setSelectedColor(color); setSelectedSize(""); setSelectedImageIndex(0); }} className={`w-24 overflow-hidden rounded-xl border-2 bg-white text-left transition ${selectedColor === color ? "border-brand-primary shadow-md" : "border-gray-200 hover:border-brand-primary"}`}><img src={preview.url} alt={`${product.name} in ${color}`} className="h-24 w-full object-cover"/><span className="block truncate px-2 py-2 text-center text-xs font-semibold">{color}</span></button>; })}</div></div>}

              <div className="mt-8 border-t pt-7">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Select size</h2>
                  <span className="text-sm text-gray-500">Age range</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {sizeOptions.map((item) => (
                    <button key={`${item.sku || "size"}-${item.size}`} type="button" disabled={item.stock <= 0} onClick={() => setSelectedSize(item.size)} className={`min-w-20 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${selectedSize === item.size ? "border-brand-primary bg-brand-primary text-white" : "border-gray-200 hover:border-brand-primary"} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}>
                      {item.size}
                    </button>
                  ))}
                </div>
                {selectedSize && <p className={`mt-3 text-sm ${availableStock > 0 ? "text-green-700" : "text-red-600"}`}>{availableStock > 0 ? `${availableStock} available for this size` : "No more available in this size"}</p>}
              </div>

              <button type="button" onClick={addSelectedToCart} disabled={totalStock <= 0} className="mt-8 w-full rounded-xl bg-brand-primary py-4 text-lg font-semibold text-white transition hover:bg-[#2d4d33] disabled:bg-gray-400">{totalStock > 0 ? "Add to bag" : "Out of stock"}</button>

              <div className="mt-7 grid grid-cols-3 gap-3 border-t pt-6 text-center text-xs text-gray-600">
                <div><span className="block text-xl">🚚</span><span className="mt-1 block">Free delivery*</span></div>
                <div><span className="block text-xl">↩</span><span className="mt-1 block">Easy returns</span></div>
                <div><span className="block text-xl">🔒</span><span className="mt-1 block">Secure payment</span></div>
              </div>
            </section>
          </div>

          <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-semibold">Product details</h2>
              <p className="mt-5 whitespace-pre-line leading-8 text-gray-600">{product.description || "Beautifully designed kidswear focused on comfort and style."}</p>
              <dl className="mt-7 grid gap-4 border-t pt-6 sm:grid-cols-3">{product.color && <div><dt className="text-xs uppercase tracking-wider text-gray-400">Colour</dt><dd className="mt-1 font-medium">{product.color}</dd></div>}{product.fabric && <div><dt className="text-xs uppercase tracking-wider text-gray-400">Fabric</dt><dd className="mt-1 font-medium">{product.fabric}</dd></div>}{product.ageGroup && <div><dt className="text-xs uppercase tracking-wider text-gray-400">Age group</dt><dd className="mt-1 font-medium">{product.ageGroup}</dd></div>}</dl>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-semibold">Care and assurance</h2>
              <ul className="mt-5 space-y-3 text-sm text-gray-600"><li>✓ Quality checked before dispatch</li><li>✓ Carefully packed</li><li>✓ Size exchange subject to availability</li></ul>
            </div>
          </section>

          <section id="reviews" className="mt-8 rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                <h2 className="text-2xl font-semibold">Customer reviews</h2>
                <div className="mt-5 space-y-5">
                  {product.reviews?.length ? product.reviews.map((review) => (
                    <article key={review._id} className="border-b pb-5 last:border-0">
                      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{review.name}</h3>{review.verifiedPurchase && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Verified purchase</span>}</div><span className="rounded bg-green-700 px-2 py-1 text-xs text-white">★ {review.rating}</span></div>
                      <p className="mt-3 leading-7 text-gray-600">{review.comment}</p>
                    </article>
                  )) : <p className="text-gray-500">No reviews yet. Be the first to share your experience.</p>}
                </div>
              </div>
              <div className="h-fit rounded-2xl bg-brand-background p-5">
                <h3 className="text-lg font-semibold">Write a review</h3>
                {!reviewEligibility.loading && !reviewEligibility.eligible ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-semibold">Verified customers only</p><p className="mt-1">{reviewEligibility.reason}</p></div> : <><label className="mt-4 block text-sm font-medium">Rating</label>
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full rounded-xl border bg-white p-3">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{"★".repeat(value)} ({value})</option>)}
                </select>
                <label className="mt-4 block text-sm font-medium">Your experience</label>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength="1000" rows="5" placeholder="Tell other parents about fit, comfort and quality" className="mt-2 w-full rounded-xl border bg-white p-3" />
                <button type="button" disabled={submittingReview || reviewEligibility.loading} onClick={submitReview} className="mt-4 w-full rounded-xl bg-brand-primary py-3 font-medium text-white disabled:bg-gray-400">{submittingReview ? "Submitting…" : "Submit verified review"}</button></>}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default ProductDetails;
