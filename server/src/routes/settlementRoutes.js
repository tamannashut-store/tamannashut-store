import express from "express";
import SellerSettlement from "../models/SellerSettlement.js";
import { protect, admin, seller } from "../middleware/authMiddleware.js";
import { recordAudit } from "../utils/recordAudit.js";
import { releaseMatureSettlements, settlementSummary } from "../services/sellerSettlementService.js";

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

router.patch("/:id", protect, admin, async (req, res) => {
  try {
    const settlement = await SellerSettlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });
    const action = String(req.body.action || "");
    const note = String(req.body.note || "").trim().slice(0, 500);
    if (action === "hold") {
      if (settlement.status === "paid") return res.status(409).json({ message: "A paid settlement cannot be placed on hold" });
      if (note.length < 5) return res.status(400).json({ message: "Add a clear hold reason" });
      settlement.status = "held"; settlement.manualHold = true; settlement.holdReason = note;
    } else if (action === "release") {
      if (settlement.status !== "held" || !settlement.manualHold) return res.status(409).json({ message: "Only an administrator hold can be released; lifecycle holds follow the order return or refund" });
      settlement.status = settlement.eligibleAt && settlement.eligibleAt <= new Date() ? "eligible" : "pending";
      settlement.manualHold = false; settlement.holdReason = "";
    } else if (action === "adjust") {
      if (settlement.status === "paid") return res.status(409).json({ message: "Paid settlements are immutable" });
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || Math.abs(amount) > settlement.netSalesAmount) return res.status(400).json({ message: "Enter a valid adjustment within the sale value" });
      if (note.length < 5) return res.status(400).json({ message: "Explain the adjustment" });
      settlement.adjustmentAmount = Math.round(amount * 100) / 100; settlement.adjustmentNote = note;
      settlement.payableAmount = Math.max(0, Math.round((settlement.netSalesAmount - settlement.commissionAmount - settlement.refundAmount + settlement.adjustmentAmount) * 100) / 100);
    } else if (action === "mark_paid") {
      if (settlement.status !== "eligible") return res.status(409).json({ message: "Only eligible settlements can be marked paid" });
      const method = String(req.body.method || "").trim().slice(0, 80);
      const reference = String(req.body.reference || "").trim().slice(0, 150);
      if (!method || reference.length < 3) return res.status(400).json({ message: "Enter the payment method and transaction reference" });
      settlement.status = "paid"; settlement.paymentMethod = method; settlement.paymentReference = reference; settlement.paidAt = new Date();
    } else return res.status(400).json({ message: "Invalid settlement action" });
    settlement.history.push({ status: settlement.status, note: note || action.replace("_", " "), createdBy: req.user.email || String(req.user._id) });
    await settlement.save();
    await recordAudit({ user: req.user, action: `settlement.${action}`, entityType: "seller_settlement", entityId: settlement._id, summary: `${action} seller settlement`, metadata: { orderId: settlement.orderId, payableAmount: settlement.payableAmount } });
    return res.json({ settlement });
  } catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

export default router;
