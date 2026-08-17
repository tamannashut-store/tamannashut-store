import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
    try {
        const products = await Product.find({ status: "active" });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
<loc>https://www.tamannashut.com/</loc>
</url>

<url>
<loc>https://www.tamannashut.com/shop</loc>
</url>
<url>
<loc>https://www.tamannashut.com/about</loc>
</url>
<url>
<loc>https://www.tamannashut.com/contact</loc>
</url>
<url>
<loc>https://www.tamannashut.com/privacy-policy</loc>
</url>
<url>
<loc>https://www.tamannashut.com/terms-conditions</loc>
</url>
<url>
<loc>https://www.tamannashut.com/return-policy</loc>
</url>
<url>
<loc>https://www.tamannashut.com/shipping-policy</loc>
</url>
`;

        products.forEach((product) => {
            xml += `
<url>
<loc>https://www.tamannashut.com/product/${product.slug || product._id}</loc>
<lastmod>${product.updatedAt.toISOString()}</lastmod>
</url>
`;
        });

        xml += `</urlset>`;

        res.header("Content-Type", "application/xml");
        res.send(xml);

    } catch (error) {
        console.log(error);
        res.status(500).send("Sitemap Error");
    }
});

export default router;
