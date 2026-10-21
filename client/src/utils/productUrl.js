export const productPath = (product) => {
  const identifier = product?.slug || product?._id || product?.id || "";
  return `/product/${encodeURIComponent(String(identifier))}`;
};

export const productOptionUrl = (product, origin, { color = "", size = "" } = {}) => {
  const url = new URL(productPath(product), origin);
  if (color) url.searchParams.set("color", color);
  if (size) url.searchParams.set("size", size);
  return url.toString();
};

export const cartProductPath = (item) => {
  const params = new URLSearchParams();
  if (item?.selectedColor) params.set("color", item.selectedColor);
  if (item?.selectedSize) params.set("size", item.selectedSize);
  const query = params.toString();
  return `${productPath(item)}${query ? `?${query}` : ""}`;
};
