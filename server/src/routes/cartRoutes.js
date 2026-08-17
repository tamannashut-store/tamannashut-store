import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";
import Product from "../models/Product.js";
import { storefrontProductFilter } from "../utils/productVisibility.js";
import User from "../models/User.js";

const router = express.Router();

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length > 50) throw Object.assign(new Error("Invalid cart"), { status: 400 });
  const normalized = items.map((item) => ({
    productId: String(item.productId || item._id || ""),
    selectedSize: String(item.selectedSize || "").trim().slice(0, 30),
    selectedSku: String(item.selectedSku || "").trim().toUpperCase().slice(0, 80),
    qty: Math.min(Math.max(Number(item.qty) || 1, 1), 20),
  }));
  if (normalized.some((item) => !mongoose.isValidObjectId(item.productId) || !item.selectedSize || !Number.isInteger(item.qty))) {
    throw Object.assign(new Error("Cart contains an invalid item"), { status: 400 });
  }
  return normalized;
};

const cartKey = (item) => `${item.productId}:${item.selectedSku || item.selectedSize}`;
const cartTrackingUpdate = (cart) => ({ cart, cartUpdatedAt: cart.length ? new Date() : null });

const expandCart = async (cart) => {
  const products = await Product.find(storefrontProductFilter({ _id: { $in: cart.map((item) => item.productId) } })).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  return cart.flatMap((item) => {
    const product = byId.get(String(item.productId));
    if (!product) return [];
    const variant = product.variants?.find((entry) => item.selectedSku ? entry.sku === item.selectedSku : entry.size === item.selectedSize);
    const image = product.images?.find((entry) => variant?.color && entry.color?.toLowerCase() === variant.color.toLowerCase() && entry.size === variant.size)
      || product.images?.find((entry) => variant?.color && entry.color?.toLowerCase() === variant.color.toLowerCase() && !entry.size)
      || product.images?.[0];
    return [{ ...product, price: Number(variant?.price ?? product.price), selectedSize: item.selectedSize, selectedSku: variant?.sku || item.selectedSku || "", selectedColor: variant?.color || "", image: image?.url || "", qty: item.qty }];
  });
};

router.get("/", protect, async (req, res) => {
  try { return res.json({ items: await expandCart(req.user.cart || []) }); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.put("/", protect, async (req, res) => {
  try {
    const cart = normalizeItems(req.body.items);
    await User.updateOne({ _id: req.user._id }, { $set: cartTrackingUpdate(cart) });
    return res.json({ items: await expandCart(cart) });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

router.post("/merge", protect, async (req, res) => {
  try {
    const incoming = normalizeItems(req.body.items);
    const merged = new Map((req.user.cart || []).map((item) => [cartKey({ productId: String(item.productId), selectedSku: item.selectedSku, selectedSize: item.selectedSize }), { productId: String(item.productId), selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty }]));
    incoming.forEach((item) => {
      const key = cartKey(item);
      const current = merged.get(key);
      merged.set(key, { ...item, qty: Math.min((current?.qty || 0) + item.qty, 20) });
    });
    const cart = [...merged.values()].slice(0, 50);
    await User.updateOne({ _id: req.user._id }, { $set: cartTrackingUpdate(cart) });
    return res.json({ items: await expandCart(cart) });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

export default router;
