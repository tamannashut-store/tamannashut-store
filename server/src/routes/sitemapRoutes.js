import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
    try {
        const products = await Product.find();

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
<loc>https://tamannashut.com/</loc>
</url>

<url>
<loc>https://tamannashut.com/shop</loc>
</url>
<url>
<loc>https://tamannashut.com/login</loc>
</url>
<url>
<loc>https://tamannashut.com/register</loc>
</url>
<url>
<loc>https://tamannashut.com/cart</loc>
</url>
<url>
<loc>https://tamannashut.com/wishlist</loc>
</url>
<url>
<loc>https://tamannashut.com/about</loc>
</url>
<url>
<loc>https://tamannashut.com/contact</loc>
</url>
<url>
<loc>https://tamannashut.com/privacy-policy</loc>
</url>
<url>
<loc>https://tamannashut.com/terms-conditions</loc>
</url>
<url>
<loc>https://tamannashut.com/return-policy</loc>
</url>
<url>
<loc>https://tamannashut.com/shipping-policy</loc>
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

    } catch (error) {
        console.log(error);
        res.status(500).send("Sitemap Error");
    }
});

export default router;