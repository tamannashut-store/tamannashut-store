import express from "express";
import Product from "../models/Product.js";
import { productIdentifierFilter } from "../utils/productSlug.js";
import { storefrontProductFilter } from "../utils/productVisibility.js";
import { productPreviewHtml } from "../utils/productPreview.js";

const router = express.Router();
let cache = { expiresAt: 0, posts: [] };

// Only public, approved listings may be exposed to link-preview crawlers.
router.get("/product-preview/:identifier", async (req, res, next) => {
  try {
    if (!/^[a-zA-Z0-9-]{1,160}$/.test(req.params.identifier)) return res.status(404).send("Product not found");
    const product = await Product.findOne(storefrontProductFilter(productIdentifierFilter(req.params.identifier)))
      .select("name slug description images").lean();
    if (!product) return res.status(404).set("Cache-Control", "no-store").send("Product not found");
    // The same storefront URL serves the app to shoppers and HTML to crawlers.
    // Do not let a CDN reuse a crawler response for a normal browser.
    return res.set("Cache-Control", "no-store").vary("User-Agent").type("html").send(productPreviewHtml(product));
  } catch (error) { return next(error); }
});

router.get("/instagram", async (req, res) => {
  try {
    if (cache.expiresAt > Date.now()) return res.json({ posts: cache.posts });
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) return res.status(503).json({ posts: [], message: "Instagram feed is not configured" });
    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username";
    const userId = String(process.env.INSTAGRAM_USER_ID || "").trim();
    const graphVersion = String(process.env.INSTAGRAM_GRAPH_VERSION || "v23.0");
    const base = userId ? `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(userId)}/media` : "https://graph.instagram.com/me/media";
    const url = new URL(base); url.searchParams.set("fields", fields); url.searchParams.set("limit", "12"); url.searchParams.set("access_token", token);
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Instagram request failed");
    const posts = (data.data || []).map((post) => ({ id: post.id, caption: String(post.caption || "").slice(0, 300), mediaType: post.media_type, mediaUrl: post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url, permalink: post.permalink, timestamp: post.timestamp, username: post.username })).filter((post) => post.mediaUrl && post.permalink);
    cache = { posts, expiresAt: Date.now() + 15 * 60 * 1000 };
    return res.set("Cache-Control", "public, max-age=300").json({ posts });
  } catch (error) {
    console.error("INSTAGRAM FEED ERROR:", String(error?.message || "Feed unavailable").slice(0, 200));
    if (cache.posts.length) return res.status(200).json({ posts: cache.posts, stale: true });
    return res.status(502).json({ posts: [], message: "Instagram feed is temporarily unavailable" });
  }
});

export default router;
