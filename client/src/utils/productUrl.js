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
