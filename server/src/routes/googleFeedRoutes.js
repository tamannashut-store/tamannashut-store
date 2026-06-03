import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/google-feed.xml", async (req, res) => {

  const products = await Product.find();

  let xml = `<?xml version="1.0"?>
<rss version="2.0"
xmlns:g="http://base.google.com/ns/1.0">
<channel>

<title>Tamanna's Hut</title>
<link>https://tamannashut.com</link>
<description>Kids Fashion Store</description>`;

  products.forEach((product) => {

    xml += `
<item>
<g:id>${product._id}</g:id>
<title>${product.name}</title>
<link>https://tamannashut.com/product/${product._id}</link>
<g:price>${product.price} INR</g:price>
<g:condition>new</g:condition>
<g:availability>in stock</g:availability>
</item>`;
  });

  xml += `
</channel>
</rss>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

export default router;