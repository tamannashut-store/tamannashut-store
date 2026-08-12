import crypto from "crypto";
import express from "express";
import * as Sentry from "@sentry/node";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { shouldRecordOrderTransition, syncCodPaymentStatus } from "../utils/orderLifecycle.js";
import { shiprocketWebhookContext } from "../utils/webhookMonitoring.js";
import { restoreOrderStock } from "../services/orderService.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  assignShiprocketAwb, cancelShiprocketShipment, createShiprocketOrder, createShiprocketReturn,
  generateShiprocketLabel, getShiprocketCouriers, resolveShiprocketPostcode, scheduleShiprocketPickup, verifyShiprocketDeliveryPostcode,
} from "../services/shiprocketService.js";

const router = express.Router();
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || "")); const b = Buffer.from(String(right || ""));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
};
const parcelFrom = (body, existing = {}) => {
  const value = {
    destinationState: String(body.destinationState || existing.destinationState || "").trim().slice(0, 80),
    weight: Number(body.weight ?? existing.package?.weight ?? 0.5),
    length: Number(body.length ?? existing.package?.length ?? 15),
    breadth: Number(body.breadth ?? existing.package?.breadth ?? 12),
    height: Number(body.height ?? existing.package?.height ?? 5),
  };
  if ([value.weight, value.length, value.breadth, value.height].some((item) => !Number.isFinite(item) || item <= 0)) throw Object.assign(new Error("Package dimensions and weight must be greater than zero"), { status: 400 });
  return value;
};
const loadOrder = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
  return order;
};
const requireOpenFulfilment = (order) => {
  if (!["Confirmed", "Packed"].includes(order.status)) {
    throw Object.assign(new Error(`Shipping actions are unavailable while the order is ${order.status}`), { status: 409 });
  }
};
const fail = (res, error) => res.status(error.status || 500).json({ message: error.message || "Shipping operation failed" });

router.post("/events", async (req, res) => {
  if (!safeEqual(req.get("x-api-key"), process.env.SHIPROCKET_WEBHOOK_SECRET)) return res.status(401).json({ message: "Invalid webhook token" });
  const payload = req.body || {};
  try {
    const awb = String(payload.awb || payload.awb_code || "");
    const shipmentId = String(payload.shipment_id || "");
    const order = await Order.findOne({ $or: [{ "shipping.awbCode": awb || "__none__" }, { "shipping.shipmentId": shipmentId || "__none__" }, { "returnRequest.reverseAwb": awb || "__none__" }, { "returnRequest.reverseShipmentId": shipmentId || "__none__" }] });
    if (!order) return res.status(200).json({ received: true });
    const code = Number(payload.current_status_id ?? payload.shipment_status_id ?? payload.status_id);
    const isReverse = (shipmentId && shipmentId === String(order.returnRequest?.reverseShipmentId || "")) || (awb && awb === String(order.returnRequest?.reverseAwb || ""));
    const mapped = isReverse ? ({ 6: "Return Picked Up", 7: "Returned", 42: "Return Picked Up" })[code] : ({ 6: "Shipped", 7: "Delivered", 8: "Cancelled", 9: "RTO Initiated", 10: "RTO Delivered", 19: "Shipped" })[code];
    let transitioned = false;
    order.shipping.externalStatus = String(payload.current_status || payload.shipment_status || payload.status || code || "").slice(0, 120);
    order.shipping.lastEventAt = new Date();
    if (mapped) syncCodPaymentStatus(order, mapped);
    if (shouldRecordOrderTransition(order.status, mapped)) {
      if (["Cancelled", "Returned", "RTO Delivered"].includes(mapped)) await restoreOrderStock(order);
      order.status = mapped;
      order.statusHistory.push({ status: mapped, note: `Courier update: ${order.shipping.externalStatus || mapped}` });
      transitioned = true;
    }
    await order.save();
    if (transitioned) await Promise.allSettled([sendEmail(order.email, "Order Update - Tamanna's Hut", `<h2>Your order is ${mapped}</h2><p>Order <strong>${order._id}</strong> received a courier update.</p>`)]);
    return res.status(200).json({ received: true });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("integration", "shiprocket");
      scope.setTag("webhook.processing", "failed");
      scope.setContext("shipment_event", shiprocketWebhookContext(payload));
      Sentry.captureException(error);
    });
    return res.status(200).json({ received: true });
  }
});

router.get("/postcode/:pincode", protect, async (req, res) => { try { return res.json(await verifyShiprocketDeliveryPostcode(req.params.pincode, req.query.cod === "1")); } catch (error) { return fail(res, error); } });
router.use(protect, admin);
router.post("/orders/:id/couriers", async (req, res) => { try { const order = await loadOrder(req.params.id); requireOpenFulfilment(order); const parcel = parcelFrom(req.body, order.shipping); const data = await getShiprocketCouriers(order, parcel); return res.json({ couriers: data.data?.available_courier_companies || [] }); } catch (error) { return fail(res, error); } });
router.post("/orders/:id/create", async (req, res) => { try {
  const order = await loadOrder(req.params.id); requireOpenFulfilment(order); if (order.shipping?.externalOrderId) return res.json({ order, existing: true });
  const parcel = parcelFrom(req.body, order.shipping); const locality = await resolveShiprocketPostcode(order.pincode); parcel.destinationState = order.state || locality.state; order.city = locality.city; order.state = locality.state; const data = await createShiprocketOrder(order, parcel);
  if (!data.order_id || !data.shipment_id) throw Object.assign(new Error(data.message || "Shiprocket did not create the shipment"), { status: 502 });
  const currentShipping = order.shipping?.toObject ? order.shipping.toObject() : (order.shipping || {});
  order.shipping = { ...currentShipping, provider: "Shiprocket", externalOrderId: String(data.order_id || ""), shipmentId: String(data.shipment_id || ""), destinationState: parcel.destinationState, package: { weight: parcel.weight, length: parcel.length, breadth: parcel.breadth, height: parcel.height } };
  order.statusHistory.push({ status: order.status, note: "Shipment created in Shiprocket" }); await order.save(); return res.json({ order, provider: data });
} catch (error) { return fail(res, error); } });
router.post("/orders/:id/awb", async (req, res) => { try {
  const order = await loadOrder(req.params.id); requireOpenFulfilment(order); if (!order.shipping?.shipmentId) return res.status(400).json({ message: "Create the Shiprocket order first" });
  const courierId = Number(req.body.courierId); if (!courierId) return res.status(400).json({ message: "Select a courier" });
  const data = await assignShiprocketAwb(order.shipping.shipmentId, courierId); const response = data.response?.data || data;
  if (!response.awb_code && !data.awb_code) throw Object.assign(new Error(data.message || data.response?.message || "Shiprocket could not assign an AWB"), { status: 502 });
  order.shipping.courierId = courierId; order.shipping.courierName = String(req.body.courierName || response.courier_name || ""); order.shipping.awbCode = String(response.awb_code || data.awb_code || "");
  order.tracking = { trackingId: order.shipping.awbCode, courier: order.shipping.courierName }; await order.save(); return res.json({ order });
} catch (error) { return fail(res, error); } });
router.post("/orders/:id/pickup", async (req, res) => { try { const order = await loadOrder(req.params.id); requireOpenFulfilment(order); if (!order.shipping?.awbCode) return res.status(400).json({ message: "Assign an AWB first" }); await scheduleShiprocketPickup(order.shipping.shipmentId); order.shipping.pickupScheduled = true; if (order.status === "Confirmed") { order.status = "Packed"; order.statusHistory.push({ status: "Packed", note: "Courier pickup scheduled" }); } await order.save(); return res.json({ order }); } catch (error) { return fail(res, error); } });
router.post("/orders/:id/label", async (req, res) => { try { const order = await loadOrder(req.params.id); requireOpenFulfilment(order); if (!order.shipping?.awbCode) return res.status(400).json({ message: "Assign an AWB first" }); const data = await generateShiprocketLabel(order.shipping.shipmentId); if (!data.label_url) throw Object.assign(new Error(data.message || "Shiprocket did not return a shipping label"), { status: 502 }); order.shipping.labelUrl = String(data.label_url); await order.save(); return res.json({ order, labelUrl: order.shipping.labelUrl }); } catch (error) { return fail(res, error); } });
router.post("/orders/:id/cancel", async (req, res) => { try { const order = await loadOrder(req.params.id); if (!order.shipping?.awbCode) return res.status(400).json({ message: "No AWB has been assigned" }); if (order.shipping.pickupScheduled) return res.status(400).json({ message: "Cancel the pickup from Shiprocket support or dashboard" }); await cancelShiprocketShipment(order.shipping.awbCode); order.shipping.externalStatus = "Shipment cancelled"; order.statusHistory.push({ status: order.status, note: "Shiprocket shipment cancelled; order status unchanged" }); await order.save(); return res.json({ order }); } catch (error) { return fail(res, error); } });
router.post("/orders/:id/return/create", async (req, res) => { try { const order = await loadOrder(req.params.id); if (order.status !== "Return Approved") return res.status(400).json({ message: "Approve the return before creating reverse logistics" }); if (order.returnRequest?.reverseShipmentId) return res.json({ order, existing: true }); const parcel = parcelFrom(req.body, order.shipping); const data = await createShiprocketReturn(order, parcel); const response = data.response?.data || data; const shipmentId = response.shipment_id || data.shipment_id; if (!shipmentId) throw Object.assign(new Error(data.message || "Shiprocket did not create the reverse shipment"), { status: 502 }); order.returnRequest.reverseOrderId = String(response.order_id || data.order_id || ""); order.returnRequest.reverseShipmentId = String(shipmentId); order.returnRequest.reverseAwb = String(response.awb_code || data.awb_code || ""); order.statusHistory.push({ status: order.status, note: "Reverse shipment created in Shiprocket" }); await order.save(); return res.json({ order }); } catch (error) { return fail(res, error); } });
router.post("/orders/:id/return/pickup", async (req, res) => { try { const order = await loadOrder(req.params.id); if (!order.returnRequest?.reverseShipmentId) return res.status(400).json({ message: "Create the reverse shipment first" }); if (order.returnRequest.reversePickupScheduled) return res.json({ order, existing: true }); await scheduleShiprocketPickup(order.returnRequest.reverseShipmentId); order.returnRequest.reversePickupScheduled = true; order.statusHistory.push({ status: order.status, note: "Reverse pickup scheduled" }); await order.save(); return res.json({ order }); } catch (error) { return fail(res, error); } });

export default router;
