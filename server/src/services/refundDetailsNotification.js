import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import { refundDetailsRequestEmailTemplate } from "../utils/emailTemplates.js";
import { needsRefundDetails } from "../utils/refundDestination.js";

export const notifyRefundDetails = async (order, { model = Order, send = sendEmail } = {}) => {
  if (!needsRefundDetails(order) || order.refund?.detailsSubmittedAt || !order.email) return { sent: false, skipped: true };
  const claimed = await model.findOneAndUpdate({
    _id: order._id, status: "Refund Pending", paymentMethod: "COD", paymentStatus: "Paid",
    "refund.detailsSubmittedAt": null, "refund.detailsEmailSentAt": null,
    $or: [{ "refund.detailsEmailAttemptedAt": null }, { "refund.detailsEmailAttemptedAt": { $lte: new Date(Date.now() - 60_000) } }],
  }, { $set: { "refund.detailsEmailAttemptedAt": new Date() } }, { new: true });
  if (!claimed) return { sent: false, skipped: true };
  let delivery;
  try { delivery = await send(order.email, "Provide details for your COD refund - Tamanna's Hut", refundDetailsRequestEmailTemplate(order)); }
  catch { delivery = { sent: false }; }
  await model.updateOne({ _id: order._id }, { $set: {
    "refund.detailsEmailFailed": !delivery?.sent,
    ...(delivery?.sent ? { "refund.detailsEmailSentAt": new Date() } : {}),
  } });
  return { sent: Boolean(delivery?.sent) };
};
