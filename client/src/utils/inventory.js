export function activeInventory(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.filter((variant) => variant.active !== false);
  }
  return (product?.sizeStock || []).map((item) => ({ ...item, color: product?.color || "", sku: "" }));
}

export function totalInventory(product) {
  return activeInventory(product).reduce((sum, item) => sum + Number(item.stock || 0), 0);
}

export function lowStockVariants(product) {
  const threshold = Math.max(Number(product?.lowStockThreshold ?? 3), 0);
  return activeInventory(product).filter((item) => Number(item.stock || 0) <= threshold);
}
