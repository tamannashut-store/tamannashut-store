import express from "express";
import Product from "../models/Product.js";
import { inventoryItems } from "../utils/inventory.js";

const router = express.Router();

router.get("/google-feed.xml", async (req, res) => {
  try {
    const products = await Product.find({ status: "active" }).lean();

    const xmlText = (value) => String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title><![CDATA[Tamanna's Hut]]></title>
<link>https://www.tamannashut.com</link>
<description><![CDATA[Kids Fashion Store]]></description>`;

    products.forEach((product) => {

      const imageUrl = product.images?.[0]?.url || "";
      const stock = inventoryItems(product).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
      const availability = stock > 0 ? "in_stock" : "out_of_stock";

      xml += `
<item>
<g:id>${xmlText(product._id)}</g:id>

<g:title>${xmlText(product.name)}</g:title>

<g:description>${xmlText(product.description || product.name)}</g:description>

<g:link>https://www.tamannashut.com/product/${xmlText(product.slug || product._id)}</g:link>

<g:image_link>${xmlText(imageUrl)}</g:image_link>

<g:availability>${availability}</g:availability>

<g:condition>new</g:condition>

<g:price>${product.price} INR</g:price>

<g:brand>Tamanna&apos;s Hut</g:brand>
<g:identifier_exists>false</g:identifier_exists>
<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>0 INR</g:price></g:shipping>
<g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>

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
