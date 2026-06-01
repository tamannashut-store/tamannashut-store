import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {

    const products = await Product.find();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
<loc>https://tamannashut.com/</loc>
</url>

<url>
<loc>https://tamannashut.com/shop</loc>
</url>
`;

    products.forEach((product) => {
        xml += `
<url>
<loc>https://tamannashut.com/product/${product._id}</loc>
</url>
`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
});

export default router;