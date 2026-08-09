import express from "express";
import Coupon from "../models/Coupon.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router =
  express.Router();

router.post("/", protect, admin, async (req,res)=>{
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const discount = Number(req.body.discount);
    if (!code || !Number.isFinite(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ message: "Enter a valid code and discount from 1 to 100" });
    }
    const coupon = await Coupon.create({ code, discount });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000 ? "Coupon code already exists" : error.message,
    });
  }

});

router.get("/", protect, admin, async (req,res)=>{

  const coupons =
    await Coupon.find();

  res.json(coupons);

});

router.post("/validate",
async (req,res)=>{

  const coupon =
    await Coupon.findOne({
      code: String(req.body.code || "").trim().toUpperCase(),
      active: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } },
      ],
    });

  if (!coupon) {

    return res.status(400).json({
      success:false,
    });

  }

  res.json({
    success:true,
    discount:
      coupon.discount,
  });

});

export default router;
