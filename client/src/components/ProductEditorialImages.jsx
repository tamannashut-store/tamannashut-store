import { Link } from "react-router-dom";
import { optimizedImage } from "../utils/image";
import { productPath } from "../utils/productUrl";

// Portrait catalogue photos work as a pair rather than a narrow image floating
// inside a landscape banner. Prefer a second colour's lead photo.
export default function ProductEditorialImages({ product, priority = false }) {
  const photos = product.images || [];
  const first = photos[0];
  const second = photos.find((photo) => photo.color && photo.color !== first?.color) || photos[1];
  const pair = [first, second].filter(Boolean);
  return (
    <Link to={productPath(product)} aria-label={`Explore ${product.name}`} className={`grid overflow-hidden bg-[#eeede6] ${pair.length > 1 ? "aspect-[4/3] grid-cols-2" : "aspect-[4/3] place-items-center"}`}>
      {(pair.length ? pair : [{ url: "/placeholder.png" }]).map((photo, index) => (
        <img key={`${photo.url}-${index}`} src={optimizedImage(photo.url, 800)} alt={`${product.name}${photo.color ? ` — ${photo.color}` : ` — view ${index + 1}`}`} loading={priority && index === 0 ? "eager" : "lazy"} fetchPriority={priority && index === 0 ? "high" : "auto"} decoding="async" className={`h-full min-h-0 w-full min-w-0 ${pair.length > 1 ? "object-cover" : "object-contain"}`} />
      ))}
    </Link>
  );
}
