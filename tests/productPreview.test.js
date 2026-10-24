import test from "node:test";
import assert from "node:assert/strict";
import { productPreviewHtml } from "../server/src/utils/productPreview.js";
import express from "express";
import Product from "../server/src/models/Product.js";
import socialRoutes from "../server/src/routes/socialRoutes.js";

test("product previews contain product metadata and a canonical shopping link", () => {
  const html = productPreviewHtml({name: "Cotton set", slug: "cotton-set", description: "Two-piece outfit", images: [{url: "https://example.com/photo.jpg"}]});
  assert.match(html, /property="og:title" content="Cotton set/);
  assert.match(html, /property="og:image" content="https:\/\/example.com\/photo.jpg"/);
  assert.match(html, /href="https:\/\/www.tamannashut.com\/product\/cotton-set"/);
  assert.match(html, /summary_large_image/);
});

test("untrusted listing values cannot inject HTML or unsafe image URLs", () => {
  const html = productPreviewHtml({name: '<script>"bad"</script>', _id: 'abc', description: '" onload="bad', images: [{url: 'javascript:alert(1)'}]});
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.match(html, /&lt;script&gt;&quot;bad&quot;&lt;\/script&gt;/);
  assert.match(html, /https:\/\/www.tamannashut.com\/social-preview.png/);
});

test("preview route enforces storefront visibility and does not cache crawler HTML", async () => {
  const original = Product.findOne;
  let found = { name: "Cotton set", slug: "cotton-set" };
  let filter;
  Product.findOne = (query) => { filter = query; return { select: () => ({ lean: async () => found }) }; };
  const app = express(); app.use('/social', socialRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/social/product-preview`;
    const response = await fetch(`${base}/cotton-set`);
    assert.equal(response.status, 200);
    assert.equal(filter.status, 'active');
    assert.deepEqual(filter.approvalStatus, { $in: ['approved', 'not_required'] });
    assert.deepEqual(filter.sellerComplianceHold, { $ne: true });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('vary'), 'User-Agent');
    assert.match(await response.text(), /Cotton set/);
    found = null;
    assert.equal((await fetch(`${base}/private-draft`)).status, 404);
    assert.equal((await fetch(`${base}/invalid%24identifier`)).status, 404);
  } finally {
    Product.findOne = original;
    await new Promise(resolve => server.close(resolve));
  }
});
