import express from "express";
import Coupon from "../models/Coupon.js";

const router =
  express.Router();

router.post("/", async (req,res)=>{

  const coupon =
    await Coupon.create(
      req.body
    );

  res.json(coupon);

});

router.get("/", async (req,res)=>{

  const coupons =
    await Coupon.find();

  res.json(coupons);

});

router.post("/validate",
async (req,res)=>{

  const coupon =
    await Coupon.findOne({
      code: req.body.code,
      active: true,
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