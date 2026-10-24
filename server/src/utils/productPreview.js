const SITE = "https://www.tamannashut.com";
const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

export function productPreviewHtml(product) {
  const url = `${SITE}/product/${encodeURIComponent(String(product.slug || product._id))}`;
  const title = `${product.name} | Tamanna's Hut`;
  const description = String(product.description || product.name).slice(0, 300);
  const image = (product.images || []).map((item) => item.url).find((value) => {
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }) || `${SITE}/social-preview.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Tamanna's Hut">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:alt" content="${escapeHtml(product.name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
</head><body><h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(description)}</p><a href="${escapeHtml(url)}">View product</a></body></html>`;
}
