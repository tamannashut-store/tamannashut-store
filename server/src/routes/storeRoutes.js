import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { accountTypeFor } from "../utils/accountRoles.js";
import { publicSellerStore } from "../utils/sellerStore.js";
const router = express.Router();
const followerCount = id => User.countDocuments({ accountType: "customer", followedStores: id });
router.use(protect, (req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  if (accountTypeFor(req.user) !== "customer") return res.status(403).json({ message: "Sign in with a customer account to follow stores" });
  next();
});
router.route("/:id/follow")
  .get(async (req, res, next) => { try {
    if (!await publicSellerStore(req.params.id)) return res.status(404).json({ message: "This store is unavailable" });
    res.json({ following: (req.user.followedStores || []).some((id) => String(id) === req.params.id.toLowerCase()), followerCount: await followerCount(req.params.id) });
  } catch (error) { next(error); } })
  .put(async (req, res, next) => { try {
    const store = await publicSellerStore(req.params.id);
    if (!store) return res.status(404).json({ message: "This store is unavailable" });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { followedStores: store.id } });
    res.json({ following: true, followerCount: await followerCount(store.id) });
  } catch (error) { next(error); } })
  .delete(async (req, res, next) => { try {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ message: "This store is unavailable" });
    await User.updateOne({ _id: req.user._id }, { $pull: { followedStores: req.params.id } });
    res.json({ following: false, followerCount: await followerCount(req.params.id) });
  } catch (error) { next(error); } });
export default router;
