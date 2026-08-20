const SITE_URL = "https://www.tamannashut.com";

const activeInventory = (product) => {
  const variants = (product?.variants || []).filter((variant) => variant.active !== false);
  const rows = variants.length ? variants : (product?.sizeStock || []);
  return rows.reduce((total, row) => total + Math.max(0, Number(row.stock || 0)), 0);
};

export const productStructuredData = (product, path, images = []) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  image: images.map((image) => image.url).filter(Boolean),
  description: product.description,
  ...(product.baseSku ? { sku: product.baseSku } : {}),
  ...(product.category ? { category: product.category } : {}),
  brand: { "@type": "Brand", name: "Tamanna's Hut" },
  offers: {
    "@type": "Offer",
    url: `${SITE_URL}${path}`,
    priceCurrency: "INR",
    price: Number(product.price),
    availability: activeInventory(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnShippingFees",
      customerRemorseReturnFees: "https://schema.org/ReturnShippingFees",
      itemDefectReturnFees: "https://schema.org/FreeReturn",
      merchantReturnLink: `${SITE_URL}/return-policy`,
    },
  },
  ...(product.reviews?.length ? {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(product.averageRating || 0).toFixed(1),
      reviewCount: product.reviews.length,
    },
  } : {}),
});
