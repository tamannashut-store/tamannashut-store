import express from "express";
import SellerSettlement from "../models/SellerSettlement.js";
import SellerProfile from "../models/SellerProfile.js";
import { protect, admin, seller } from "../middleware/authMiddleware.js";
import { recordAudit } from "../utils/recordAudit.js";
import { releaseMatureSettlements, settlementSummary } from "../services/sellerSettlementService.js";
import { generateSettlementStatement } from "../utils/generateSettlementStatement.js";

const router = express.Router();
router.get("/seller/mine", protect, seller, async (req, res) => {
  try {
    await releaseMatureSettlements();
    const settlements = await SellerSettlement.find({ sellerId: req.user._id }).populate("orderId", "createdAt status paymentMethod invoiceNumber").sort({ createdAt: -1 }).lean();
    return res.json({ settlements, summary: settlementSummary(settlements) });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/", protect, admin, async (_req, res) => {
  try {
    await releaseMatureSettlements();
    const settlements = await SellerSettlement.find().populate("sellerId", "name email").populate("orderId", "createdAt status paymentMethod invoiceNumber").sort({ createdAt: -1 }).lean();
    return res.json({ settlements, summary: settlementSummary(settlements) });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/seller/:id/statement", protect, seller, async (req, res) => {
  try {
    const settlement = await SellerSettlement.findOne({ _id: req.params.id, sellerId: req.user._id })
      .populate("sellerId", "name email")
      .populate("orderId", "createdAt status paymentMethod invoiceNumber");
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });
    return generateSettlementStatement(settlement, res);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/:id/statement", protect, admin, async (req, res) => {
  try {
    const settlement = await SellerSettlement.findById(req.params.id)
      .populate("sellerId", "name email")
      .populate("orderId", "createdAt status paymentMethod invoiceNumber");
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });
    return generateSettlementStatement(settlement, res);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch("/:id", protect, admin, async (req, res) => {
  try {
    const settlement = await SellerSettlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });
    const action = String(req.body.action || "");
    const note = String(req.body.note || "").trim().slice(0, 500);
    if (action === "hold") {
      if (["paid", "processing", "reversed"].includes(settlement.status)) return res.status(409).json({ message: "A paid, processing or reversed settlement cannot be placed on hold" });
      if (note.length < 5) return res.status(400).json({ message: "Add a clear hold reason" });
      settlement.status = "held"; settlement.manualHold = true; settlement.holdReason = note;
    } else if (action === "release") {
      if (settlement.status !== "held" || !settlement.manualHold) return res.status(409).json({ message: "Only an administrator hold can be released; lifecycle holds follow the order return or refund" });
      settlement.status = settlement.eligibleAt && settlement.eligibleAt <= new Date() ? "eligible" : "pending";
      settlement.manualHold = false; settlement.holdReason = "";
    } else if (action === "adjust") {
      if (["paid", "processing", "reversed"].includes(settlement.status)) return res.status(409).json({ message: "Paid, processing and reversed settlements are immutable" });
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > settlement.netSalesAmount) return res.status(400).json({ message: "Enter a non-zero adjustment within the sale value" });
      if (note.length < 5) return res.status(400).json({ message: "Explain the adjustment" });
      const categories = new Set(["shipping", "return_shipping", "tax_withholding", "fee_correction", "goodwill", "other"]);
      const category = String(req.body.category || "");
      if (!categories.has(category)) return res.status(400).json({ message: "Select a valid adjustment category" });
      const roundedAmount = Math.round(amount * 100) / 100;
      settlement.adjustments.push({ amount: roundedAmount, category, note, createdBy: req.user.email || String(req.user._id) });
      settlement.adjustmentAmount = Math.round((Number(settlement.adjustmentAmount || 0) + roundedAmount) * 100) / 100; settlement.adjustmentNote = note;
      settlement.payableAmount = Math.max(0, Math.round((settlement.netSalesAmount - settlement.commissionAmount - settlement.refundAmount + settlement.adjustmentAmount) * 100) / 100);
    } else if (action === "initiate_payout" || action === "retry_payout") {
      const expectedStatus = action === "retry_payout" ? "failed" : "eligible";
      if (settlement.status !== expectedStatus) return res.status(409).json({ message: action === "retry_payout" ? "Only failed payouts can be retried" : "Only eligible settlements can enter payout processing" });
      const sellerProfile = await SellerProfile.findOne({ userId: settlement.sellerId }).select("verificationStatus bankVerification.status closure.status").lean();
      if (!sellerProfile || sellerProfile.verificationStatus !== "verified" || sellerProfile.bankVerification?.status !== "verified" || sellerProfile.closure?.status === "closed") return res.status(409).json({ message: "Payout is blocked until the seller and settlement bank account are verified" });
      const method = String(req.body.method || "").trim().slice(0, 80);
      if (!method) return res.status(400).json({ message: "Select the payout method" });
      settlement.status = "processing"; settlement.paymentMethod = method; settlement.paymentReference = ""; settlement.payoutFailureReason = ""; settlement.reconciliationStatus = "pending";
      settlement.payoutAttempts.push({ status: "processing", method, note });
    } else if (action === "mark_paid") {
      if (settlement.status !== "processing") return res.status(409).json({ message: "Only a payout in processing can be marked paid" });
      const method = String(req.body.method || settlement.paymentMethod || "").trim().slice(0, 80);
      const reference = String(req.body.reference || "").trim().slice(0, 150);
      if (!method || reference.length < 3) return res.status(400).json({ message: "Enter the payment method and transaction reference" });
      const duplicateReference = await SellerSettlement.exists({ _id: { $ne: settlement._id }, status: "paid", paymentReference: reference });
      if (duplicateReference) return res.status(409).json({ message: "This payout reference is already attached to another paid settlement" });
      settlement.status = "paid"; settlement.paymentMethod = method; settlement.paymentReference = reference; settlement.paidAt = new Date(); settlement.payoutFailureReason = ""; settlement.reconciliationStatus = "matched"; settlement.reconciledAt = new Date();
      const attempt = settlement.payoutAttempts.at(-1); if (attempt?.status === "processing") { attempt.status = "paid"; attempt.reference = reference; attempt.completedAt = new Date(); }
    } else if (action === "mark_failed") {
      if (settlement.status !== "processing") return res.status(409).json({ message: "Only a payout in processing can be marked failed" });
      if (note.length < 5) return res.status(400).json({ message: "Add the bank or gateway failure reason" });
      settlement.status = "failed"; settlement.payoutFailureReason = note; settlement.reconciliationStatus = "exception";
      const attempt = settlement.payoutAttempts.at(-1); if (attempt?.status === "processing") { attempt.status = "failed"; attempt.note = note; attempt.completedAt = new Date(); }
    } else return res.status(400).json({ message: "Invalid settlement action" });
    settlement.history.push({ status: settlement.status, note: note || action.replace("_", " "), createdBy: req.user.email || String(req.user._id) });
    await settlement.save();
    await recordAudit({ user: req.user, action: `settlement.${action}`, entityType: "seller_settlement", entityId: settlement._id, summary: `${action} seller settlement`, metadata: { orderId: settlement.orderId, payableAmount: settlement.payableAmount } });
    return res.json({ settlement });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

export default router;
