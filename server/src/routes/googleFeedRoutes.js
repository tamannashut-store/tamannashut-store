import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/google-feed.xml", async (req, res) => {
  try {
    const products = await Product.find();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title><![CDATA[Tamanna's Hut]]></title>
<link>https://tamannashut.com</link>
<description><![CDATA[Kids Fashion Store]]></description>`;

    products.forEach((product) => {

      const imageUrl = product.image?.startsWith("http")
        ? product.image
        : `https://tamannashut-store.onrender.com${product.image}`;

      xml += `
<item>
<g:id>${product._id}</g:id>

<g:title><![CDATA[${product.name || ""}]]></g:title>

<g:description><![CDATA[
${product.description || product.name || ""}
]]></g:description>

<g:link>https://tamannashut.com/product/${product._id}</g:link>

<g:image_link>${imageUrl}</g:image_link>

<g:availability>in stock</g:availability>

<g:condition>new</g:condition>

<g:price>${product.price} INR</g:price>

<g:brand><![CDATA[Tamanna's Hut]]></g:brand>

<g:google_product_category>
Apparel & Accessories > Clothing
</g:google_product_category>

</item>`;
    });

    xml += `
</channel>
</rss>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);

  } catch (error) {
    console.log(error);
    res.status(500).send("Feed Error");
  }
});

export default router;