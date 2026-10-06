export default function ProductRating({ product, className = "" }) {
  const count = Math.max(0, Math.floor(Number(product.approvedReviewCount) || 0));
  const rating = Number(product.averageRating);
  const rated = count > 0 && Number.isFinite(rating) && rating >= 1 && rating <= 5;
  return <p className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`} aria-label={rated ? `Rated ${rating.toFixed(1)} out of 5 from ${count} approved review${count === 1 ? "" : "s"}` : "No reviews yet"}>
    <span aria-hidden="true" className={rated ? "text-amber-600" : "text-slate-400"}>★</span>
    {rated ? <><span className="font-semibold text-slate-800">{rating.toFixed(1)}</span><span className="text-slate-500">({count} review{count === 1 ? "" : "s"})</span></> : <span className="text-slate-500">No reviews yet</span>}
  </p>;
}
