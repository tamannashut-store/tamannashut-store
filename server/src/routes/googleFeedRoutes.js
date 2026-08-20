import express from "express";
import Product from "../models/Product.js";
import { storefrontProductFilter } from "../utils/productVisibility.js";
import { buildGoogleMerchantFeed } from "../utils/googleMerchantFeed.js";

const router = express.Router();

router.get("/google-feed.xml", async (req, res) => {
  try {
    const products = await Product.find(storefrontProductFilter()).lean();
    const xml = buildGoogleMerchantFeed(products);

    res.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
    res.set("Content-Type", "application/xml");
    res.send(xml);

  } catch (error) {
    console.log(error);
    res.status(500).send("Feed Error");
  }
});

export default router;
