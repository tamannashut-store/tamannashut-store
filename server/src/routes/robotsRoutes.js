import express from "express";

const router = express.Router();

router.get("/robots.txt", (req, res) => {
  res.type("text/plain");

  res.send(`
User-agent: *
Allow: /

Sitemap: https://www.tamannashut.com/sitemap.xml
  `);
});

export default router;
