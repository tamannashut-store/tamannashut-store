import SellerSettlement from "../models/SellerSettlement.js";
import User from "../models/User.js";

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const terminalReversalStatuses = new Set(["Cancelled", "Refunded", "RTO Delivered"]);

export const commissionPercent = () => {
  const value = Number(process.env.MARKETPLACE_COMMISSION_PERCENT || 0);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
};

export const settlementHoldDays = () => {
  const value = Number(process.env.MARKETPLACE_SETTLEMENT_HOLD_DAYS || 7);
  return Number.isFinite(value) ? Math.min(90, Math.max(0, Math.floor(value))) : 7;
};

export const settlementEligibilityDate = (order) => {
  const deliveredAt = [...(order.statusHistory || [])].reverse().find((entry) => entry.status === "Delivered")?.createdAt || order.updatedAt || new Date();
  return new Date(new Date(deliveredAt).getTime() + settlementHoldDays() * 86400000);
};

export const groupSellerLines = (order) => {
  const groups = new Map();
  for (const item of order.products || []) {
    if (!item.sellerId) continue;
    const key = String(item.sellerId);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
};

export const settlementAmounts = ({ order, lines, percent = commissionPercent() }) => {
  const grossAmount = money(lines.reduce((sum, item) => sum + Number(item.lineTotal ?? Number(item.price || 0) * Number(item.qty || 0)), 0));
  const subtotal = Math.max(Number(order.subtotal || 0), grossAmount, 0);
  const allocatedDiscount = subtotal > 0 ? money(Number(order.discount || 0) * (grossAmount / subtotal)) : 0;
  const netSalesAmount = money(Math.max(0, grossAmount - allocatedDiscount));
  const commissionAmount = money(netSalesAmount * (percent / 100));
  const refundRatio = Number(order.totalAmount || 0) > 0 ? Math.min(1, Number(order.refund?.amount || 0) / Number(order.totalAmount)) : 0;
  const refundAmount = terminalReversalStatuses.has(order.status) ? money(netSalesAmount * (order.status === "Refunded" ? refundRatio || 1 : 1)) : 0;
  return { grossAmount, allocatedDiscount, netSalesAmount, commissionPercent: percent, commissionAmount, refundAmount };
};

export const desiredSettlementStatus = (order, currentStatus = "pending") => {
  if (terminalReversalStatuses.has(order.status)) return "reversed";
  if (currentStatus === "paid") return "paid";
  if (["Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending", "RTO Initiated"].includes(order.status)) return "held";
  if (order.status === "Delivered" && ["processing", "failed"].includes(currentStatus)) return currentStatus;
  if (order.status === "Delivered") return settlementEligibilityDate(order) <= new Date() ? "eligible" : "pending";
  return "pending";
};

export const fulfillmentStatusForOrder = (status) => {
  if (["Cancelled", "Refunded"].includes(status)) return "cancelled";
  if (["Return Picked Up", "Returned", "RTO Initiated", "RTO Delivered"].includes(status)) return "returned";
  if (status === "Delivered") return "delivered";
  if (status === "Shipped") return "shipped";
  if (["Confirmed", "Processing", "Packed"].includes(status)) return "ready";
  return "pending";
};

export const syncOrderSettlements = async (order) => {
  const groups = groupSellerLines(order);
  const marketplaceSellers = groups.size ? await User.find({
    _id: { $in: [...groups.keys()] },
    $or: [{ accountType: "seller" }, { sellerRole: "member" }],
  }).select("_id").lean() : [];
  const marketplaceSellerIds = new Set(marketplaceSellers.map((seller) => String(seller._id)));
  const results = [];
  for (const [sellerId, lines] of groups) {
    if (!marketplaceSellerIds.has(sellerId)) continue;
    const existing = await SellerSettlement.findOne({ sellerId, orderId: order._id });
    const amounts = settlementAmounts({ order, lines, percent: existing?.commissionPercent ?? commissionPercent() });
    const lifecycleStatus = desiredSettlementStatus(order, existing?.status);
    const status = existing?.manualHold && !["reversed", "paid"].includes(lifecycleStatus) ? "held" : lifecycleStatus;
    const adjustmentAmount = money(existing?.adjustmentAmount || 0);
    const payableAmount = money(Math.max(0, amounts.netSalesAmount - amounts.commissionAmount - amounts.refundAmount + adjustmentAmount));
    const update = {
      ...amounts,
      payableAmount,
      status,
      lineItems: lines.map((item) => ({ productId: item._id, name: item.name, sku: item.sku || "", quantity: Number(item.qty || 0), amount: money(item.lineTotal ?? Number(item.price || 0) * Number(item.qty || 0)) })),
    };
    if (order.status === "Delivered") update.eligibleAt = existing?.eligibleAt || settlementEligibilityDate(order);
    const settlement = existing || new SellerSettlement({ sellerId, orderId: order._id, history: [] });
    if (settlement.status !== status) settlement.history.push({ status, note: `Order is ${order.status}`, createdBy: "system" });
    Object.assign(settlement, update);
    await settlement.save();
    results.push(settlement);
  }
  if (order.sellerFulfillments?.length && order.constructor?.updateOne) {
    const fulfillmentStatus = fulfillmentStatusForOrder(order.status);
    await order.constructor.updateOne(
      { _id: order._id, "sellerFulfillments.0": { $exists: true } },
      { $set: { "sellerFulfillments.$[].status": fulfillmentStatus, "sellerFulfillments.$[].updatedAt": new Date() } }
    );
  }
  return results;
};

export const syncOrderSettlementsSafely = async (order) => {
  try {
    return await syncOrderSettlements(order);
  } catch (error) {
    console.error(`Settlement sync failed for order ${String(order?._id || "unknown")}:`, error.message);
    return [];
  }
};

export const releaseMatureSettlements = () => SellerSettlement.updateMany(
  { status: "pending", manualHold: { $ne: true }, eligibleAt: { $ne: null, $lte: new Date() } },
  { $set: { status: "eligible" }, $push: { history: { status: "eligible", note: "Return window completed", createdBy: "system", createdAt: new Date() } } }
);

export const settlementSummary = (records) => records.reduce((summary, item) => {
  summary[item.status] = money((summary[item.status] || 0) + Number(item.payableAmount || 0));
  summary.total = money(summary.total + Number(item.payableAmount || 0));
  return summary;
}, { total: 0, pending: 0, eligible: 0, held: 0, processing: 0, failed: 0, paid: 0, reversed: 0 });
