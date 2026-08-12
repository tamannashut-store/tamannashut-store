export function inventoryItems(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.filter((variant) => variant.active !== false);
  }
  return Array.isArray(product?.sizeStock) ? product.sizeStock : [];
}

export function isLowStockProduct(product) {
  const threshold = Math.max(Number(product?.lowStockThreshold ?? 3), 0);
  const items = inventoryItems(product);
  return items.length > 0 && items.some((item) => Number(item.stock || 0) <= threshold);
}
