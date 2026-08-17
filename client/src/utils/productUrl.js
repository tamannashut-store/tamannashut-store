export const productPath = (product) => {
  const identifier = product?.slug || product?._id || product?.id || "";
  return `/product/${encodeURIComponent(String(identifier))}`;
};
