import Order from "../models/Order.js";
import { trackShiprocketAwb } from "./shiprocketService.js";
import { courierStatus, courierProgress } from "../utils/courierLifecycle.js";
import { syncCodPaymentStatus } from "../utils/orderLifecycle.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderStatusEmailTemplate } from "../utils/emailTemplates.js";

export const applyCourierProgress = async (order, payload, { Orders = Order, notify = sendEmail } = {}) => {
  const reverse = Boolean((payload.awb && payload.awb === order.returnRequest?.reverseAwb) || (payload.shipment_id && String(payload.shipment_id) === String(order.returnRequest?.reverseShipmentId || "")));
  const mapped = courierStatus(payload.current_status_id ?? payload.shipment_status_id ?? payload.status_id, reverse);
  const steps = courierProgress(order.status, mapped, reverse);
  const externalStatus = String(payload.current_status || payload.shipment_status || payload.status || "").slice(0, 120);
  // Compare the stored status to avoid duplicate timeline entries and emails from
  // overlapping webhook and polling updates. Final/return/refund states never regress.
  const filter = { _id: order._id, status: order.status };
  if (!reverse && order.shipping?.awbCode) filter["shipping.awbCode"] = order.shipping.awbCode;
  const now = new Date();
  const fields = { "shipping.lastCheckedAt": now };
  if (!["Delivered", "Returned", "Refunded", "Cancelled", "RTO Delivered"].includes(order.status)) {
    fields["shipping.externalStatus"] = externalStatus; fields["shipping.lastEventAt"] = now;
  }
  if (steps.length) {
    fields.status = steps.at(-1);
    const payment = { paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus };
    syncCodPaymentStatus(payment, fields.status); fields.paymentStatus = payment.paymentStatus;
  }
  const updated = await Orders.findOneAndUpdate(filter, { $set: fields, ...(steps.length ? { $push: { statusHistory: { $each: steps.map(status => ({ status, note: `Courier update: ${externalStatus || status}`, createdAt: now })) } } } : {}) }, { new: true });
  if (updated && steps.length && updated.email) await Promise.allSettled([notify(updated.email, `Order ${updated.status} - Tamanna's Hut`, orderStatusEmailTemplate(updated, `Courier update: ${externalStatus || updated.status}`))]);
  return updated || order;
};

export const syncShipmentTracking = async (order, { track = trackShiprocketAwb, apply = applyCourierProgress } = {}) => {
  if (!order.shipping?.awbCode) throw Object.assign(new Error("Assign an AWB before syncing tracking"), { status: 400 });
  const data = await track(order.shipping.awbCode);
  const tracking = data.tracking_data;
  if (!tracking || Number(tracking.track_status) !== 1) throw Object.assign(new Error("Courier tracking is not available yet. The existing order status is unchanged."), { status: 502 });
  const latest = tracking.shipment_track?.[0];
  if (!latest || String(latest.awb_code) !== String(order.shipping.awbCode)) throw Object.assign(new Error("Courier tracking identity could not be verified"), { status: 502 });
  return apply(order, { awb: order.shipping.awbCode, current_status_id: tracking.shipment_status, current_status: latest.current_status });
};
let polling = false;
export const reconcileShipmentTracking = async () => {
  if (polling || !process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) return;
  polling = true;
  try {
    const due = new Date(Date.now() - 10 * 60_000);
    const orders = await Order.find({ status: { $in: ["Confirmed", "Packed", "Shipped"] }, "shipping.awbCode": { $exists: true, $ne: "" }, $or: [{ "shipping.lastCheckedAt": { $exists: false } }, { "shipping.lastCheckedAt": { $lt: due } }] }).sort({ "shipping.lastCheckedAt": 1 }).limit(50);
    for (const order of orders) {
      await Order.updateOne({ _id: order._id }, { $set: { "shipping.lastCheckedAt": new Date() } });
      try { await syncShipmentTracking(order); } catch { /* Retry on the next cycle; never guess a shipping status. */ }
    }
  } finally { polling = false; }
};
export const startShipmentTracking = () => {
  const run = () => reconcileShipmentTracking().catch(() => console.warn("Shipment tracking reconciliation will retry"));
  run(); const timer = setInterval(run, 60_000); timer.unref(); return () => clearInterval(timer);
};
