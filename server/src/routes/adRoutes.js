import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import AdCampaign from "../models/AdCampaign.js";
import Product from "../models/Product.js";
import { admin, protect, seller } from "../middleware/authMiddleware.js";
import { storefrontProductFilter } from "../utils/productVisibility.js";
import { recordAudit } from "../utils/recordAudit.js";
import { createRazorpayRefund } from "../services/refundService.js";
import { AD_PACKAGES, AD_PLACEMENTS } from "../utils/adCampaign.js";
import { objectIdFromInput, razorpayIdFromInput } from "../utils/inputSecurity.js";

const router = express.Router();
const packages = AD_PACKAGES;
const placements = new Set(AD_PLACEMENTS);
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const safeCampaign = (campaign) => ({
  ...campaign,
  ctr: campaign.impressions ? Number(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0,
});

router.get("/packages", protect, seller, (_req, res) => res.json({
  packages: Object.entries(packages).map(([key, value]) => ({ key, ...value })),
  placements: [{ key: "home", label: "Homepage sponsored row" }, { key: "shop", label: "Shop sponsored row" }],
}));

router.get("/seller", protect, seller, async (req, res) => {
  try {
    await AdCampaign.updateMany({ sellerId: req.user._id, status: "payment_pending", createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } }, { $set: { status: "cancelled" } });
    const [campaigns, products] = await Promise.all([
      AdCampaign.find({ sellerId: req.user._id }).select("-razorpayOrderId -razorpayPaymentId").populate("productId", "name slug images price status approvalStatus sellerComplianceHold").sort({ createdAt: -1 }).lean(),
      Product.find({ sellerId: req.user._id, ...storefrontProductFilter() }).select("name slug images price").sort({ updatedAt: -1 }).lean(),
    ]);
    return res.json({ campaigns: campaigns.map(safeCampaign), products });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/seller/create-order", protect, seller, async (req, res) => {
  try {
    const selectedPackage = packages[String(req.body.packageKey || "")];
    const placement = String(req.body.placement || "");
    if (!selectedPackage || !placements.has(placement)) return res.status(400).json({ message: "Select a valid ad package and placement" });
    const productId = objectIdFromInput(req.body.productId, "product identifier");
    const product = await Product.findOne({ _id: productId, sellerId: req.user._id, ...storefrontProductFilter() }).select("_id name");
    if (!product) return res.status(404).json({ message: "Only your approved, active listings can be promoted" });
    await AdCampaign.updateMany({ sellerId: req.user._id, status: "payment_pending", createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } }, { $set: { status: "cancelled" } });
    const overlapping = await AdCampaign.exists({ sellerId: req.user._id, productId: product._id, placement, status: { $in: ["payment_pending", "pending_review", "active", "paused"] } });
    if (overlapping) return res.status(409).json({ message: "This listing already has an unfinished campaign in that placement" });
    const campaign = await AdCampaign.create({ sellerId: req.user._id, productId: product._id, placement, packageKey: req.body.packageKey, durationDays: selectedPackage.days, amount: selectedPackage.amount });
    try {
      const paymentOrder = await razorpay.orders.create({
        amount: selectedPackage.amount * 100,
        currency: "INR",
        receipt: `ad_${String(campaign._id).slice(-12)}`,
        notes: { purpose: "seller_ad", campaignId: String(campaign._id), sellerId: String(req.user._id) },
      });
      campaign.razorpayOrderId = paymentOrder.id;
      await campaign.save();
      return res.status(201).json({ campaignId: campaign._id, order: paymentOrder });
    } catch (paymentError) {
      await AdCampaign.deleteOne({ _id: campaign._id, status: "payment_pending" });
      throw paymentError;
    }
  } catch (error) { return res.status(error.code === 11000 ? 409 : error.status || 500).json({ message: error.code === 11000 ? "This listing already has an unfinished campaign in that placement" : error.message || "Ad payment could not be started" }); }
});

router.post("/seller/verify", protect, seller, async (req, res) => {
  try {
    const campaignId = objectIdFromInput(req.body.campaignId, "campaign identifier");
    const razorpayOrderId = razorpayIdFromInput(req.body.razorpay_order_id, "order", "Razorpay order identifier");
    const razorpayPaymentId = razorpayIdFromInput(req.body.razorpay_payment_id, "pay", "Razorpay payment identifier");
    const razorpaySignature = typeof req.body.razorpay_signature === "string" ? req.body.razorpay_signature : "";
    if (!razorpaySignature) return res.status(400).json({ message: "Incomplete payment response" });
    const campaign = await AdCampaign.findOne({ _id: campaignId, sellerId: req.user._id, razorpayOrderId: razorpayOrderId, status: { $in: ["payment_pending", "cancelled"] } });
    if (!campaign) return res.status(409).json({ message: "This ad payment is not available for verification" });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    const expectedBuffer = Buffer.from(expected); const receivedBuffer = Buffer.from(razorpaySignature);
    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) return res.status(400).json({ message: "Invalid payment signature" });
    const [order, payment] = await Promise.all([razorpay.orders.fetch(razorpayOrderId), razorpay.payments.fetch(razorpayPaymentId)]);
    const amount = Math.round(campaign.amount * 100);
    if (order.notes?.campaignId !== String(campaign._id) || order.notes?.sellerId !== String(req.user._id) || Number(order.amount) !== amount || payment.order_id !== order.id || Number(payment.amount) !== amount || payment.status !== "captured") return res.status(409).json({ message: "Ad payment amount or status could not be verified" });
    campaign.razorpayPaymentId = razorpayPaymentId; campaign.status = "pending_review"; campaign.paidAt = new Date(); await campaign.save();
    await recordAudit({ user: req.user, action: "seller_ad_paid", entityType: "AdCampaign", entityId: campaign._id, summary: "Seller paid for a listing promotion", metadata: { placement: campaign.placement, amount: campaign.amount } }).catch(() => {});
    return res.json({ message: "Payment verified. Your campaign is awaiting platform review.", campaign });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

router.patch("/seller/:id/status", protect, seller, async (req, res) => {
  try {
    const requested = String(req.body.status || "");
    const campaignId = objectIdFromInput(req.params.id, "campaign identifier");
    const campaign = await AdCampaign.findOne({ _id: campaignId, sellerId: req.user._id });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (requested === "paused" && campaign.status === "active") campaign.status = "paused";
    else if (requested === "active" && campaign.status === "paused" && campaign.endsAt > new Date()) campaign.status = "active";
    else if (requested === "cancelled" && campaign.status === "payment_pending") campaign.status = "cancelled";
    else return res.status(409).json({ message: "That campaign action is not available" });
    await campaign.save(); return res.json(campaign);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/admin", protect, admin, async (_req, res) => {
  try { const campaigns = await AdCampaign.find().populate("sellerId", "name email").populate("productId", "name slug images price status approvalStatus sellerComplianceHold").sort({ createdAt: -1 }).lean(); return res.json({ campaigns: campaigns.map(safeCampaign) }); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch("/admin/:id/review", protect, admin, async (req, res) => {
  try {
    const campaignId = objectIdFromInput(req.params.id, "campaign identifier");
    const decision = String(req.body.decision || ""); const campaign = await AdCampaign.findById(campaignId).populate("productId");
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (decision === "approved") {
      if (campaign.status !== "pending_review") return res.status(409).json({ message: "Only paid campaigns awaiting review can be approved" });
      const productEligible = campaign.productId && campaign.productId.status === "active" && ["approved", "not_required"].includes(campaign.productId.approvalStatus) && campaign.productId.sellerComplianceHold !== true;
      if (!productEligible) return res.status(409).json({ message: "The listing is no longer eligible for promotion" });
      campaign.status = "active"; campaign.startsAt = new Date(); campaign.endsAt = new Date(Date.now() + campaign.durationDays * 86400000);
    } else if (decision === "rejected" && campaign.status === "pending_review") {
      if (!String(req.body.note || "").trim()) return res.status(400).json({ message: "Add a clear rejection reason for the seller" });
      const refund = await createRazorpayRefund({ paymentId: campaign.razorpayPaymentId, amount: campaign.amount, reason: String(req.body.note).trim().slice(0, 200), orderId: campaign._id, idempotencyKey: `ad-reject-${campaign._id}` });
      campaign.status = "rejected"; campaign.refundStatus = "submitted"; campaign.refundId = String(refund.id || "");
    }
    else if (decision === "paused" && campaign.status === "active") campaign.status = "paused";
    else if (decision === "active" && campaign.status === "paused" && campaign.endsAt > new Date()) campaign.status = "active";
    else return res.status(409).json({ message: "That review action is not available" });
    campaign.reviewNote = String(req.body.note || "").trim().slice(0, 500); campaign.reviewedAt = new Date(); campaign.reviewedBy = req.user._id; await campaign.save();
    await recordAudit({ user: req.user, action: `seller_ad_${decision}`, entityType: "AdCampaign", entityId: campaign._id, summary: `Seller ad campaign ${decision}`, metadata: { sellerId: String(campaign.sellerId), productId: String(campaign.productId?._id || campaign.productId) } });
    return res.json(campaign);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/placements/:placement", async (req, res) => {
  try {
    const placement = String(req.params.placement || ""); if (!placements.has(placement)) return res.status(404).json({ message: "Placement not found" });
    await AdCampaign.updateMany({ status: { $in: ["active", "paused"] }, endsAt: { $lte: new Date() } }, { $set: { status: "completed" } });
    const campaigns = await AdCampaign.find({ status: "active", placement, startsAt: { $lte: new Date() }, endsAt: { $gt: new Date() } }).sort({ impressions: 1, createdAt: 1 }).limit(8).populate({ path: "productId", match: storefrontProductFilter(), select: "name slug images price mrp category averageRating variants sizeStock" }).lean();
    const visible = campaigns.filter((item) => item.productId);
    if (visible.length) await AdCampaign.updateMany({ _id: { $in: visible.map((item) => item._id) } }, { $inc: { impressions: 1 } });
    res.set("Cache-Control", "public, max-age=20, s-maxage=60");
    return res.json({ campaigns: visible.map((item) => ({ campaignId: item._id, product: { ...item.productId, sponsored: true } })) });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/:id/click", async (req, res) => {
  try { const campaignId = objectIdFromInput(req.params.id, "campaign identifier"); await AdCampaign.updateOne({ _id: campaignId, status: "active", startsAt: { $lte: new Date() }, endsAt: { $gt: new Date() } }, { $inc: { clicks: 1 } }); return res.status(204).end(); }
  catch { return res.status(204).end(); }
});

export default router;
