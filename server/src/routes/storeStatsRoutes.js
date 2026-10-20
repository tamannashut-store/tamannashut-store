import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getStoreStats } from "../services/storeStats.js";

const router = express.Router();
let cache;
let pending;
router.get("/", async (_req, res) => {
  try {
    if (!cache || cache.expiresAt <= Date.now()) {
      pending ||= getStoreStats(Order, User).then((totals) => {
        cache = { totals, expiresAt: Date.now() + 5 * 60 * 1000 };
      }).finally(() => { pending = null; });
      await pending;
    }
    return res.set("Cache-Control", "public, max-age=60").json(cache.totals);
  } catch {
    return res.status(503).set("Cache-Control", "no-store").json({ message: "Store totals temporarily unavailable" });
  }
});
export default router;
