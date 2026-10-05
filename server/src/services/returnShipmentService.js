import Order from "../models/Order.js";
import { createShiprocketReturn, findShiprocketReturn } from "./shiprocketService.js";
import { shiprocketShipment } from "../utils/shiprocketResponse.js";

export const createReturnShipment = async (order, parcel, {
  model = Order, findExisting = findShiprocketReturn, create = createShiprocketReturn,
} = {}) => {
  if (order.returnRequest?.reverseShipmentId) return { order, existing: true };
  const previousAttempt = order.returnRequest?.reverseCreationStatus;
  const startedAt = order.returnRequest?.reverseCreationStartedAt;
  if (previousAttempt === "creating" && startedAt && Date.now() - new Date(startedAt).getTime() < 120_000) {
    throw Object.assign(new Error("Return creation is already in progress. Refresh the order shortly."), { status: 409 });
  }
  const claimed = await model.findOneAndUpdate({
    _id: order._id, status: "Return Approved", "returnRequest.reverseShipmentId": { $in: ["", null] },
    "returnRequest.reverseCreationStatus": previousAttempt || { $in: ["", null] },
    ...(startedAt ? { "returnRequest.reverseCreationStartedAt": startedAt } : {}),
  }, { $set: { "returnRequest.reverseCreationStatus": "creating", "returnRequest.reverseCreationStartedAt": new Date(), "returnRequest.reverseCreationError": "" } }, { new: true });
  if (!claimed) throw Object.assign(new Error("This return changed or is already being processed. Refresh the order."), { status: 409 });
  let providerCalled = false;
  let shipment;
  try {
    shipment = await findExisting(order);
    if (!shipment) {
      if (["creating", "reconcile"].includes(previousAttempt)) {
        throw Object.assign(new Error("The previous request may have created a return. Check Shiprocket Returns, then retry sync; no duplicate will be created."), { status: 409 });
      }
      providerCalled = true;
      shipment = shiprocketShipment(await create(order, parcel));
      if (!shipment) throw Object.assign(new Error("Shiprocket accepted the request but did not return shipment details. Retry to sync the existing return."), { status: 502 });
    }
    const saved = await model.findOneAndUpdate({ _id: order._id }, {
      $set: {
        "returnRequest.reverseOrderId": shipment.orderId, "returnRequest.reverseShipmentId": shipment.shipmentId,
        "returnRequest.reverseAwb": shipment.awb, "returnRequest.reverseCreationStatus": "created",
        "returnRequest.reverseCreationError": "",
        "returnRequest.reversePackage": { weight: parcel.weight, length: parcel.length, breadth: parcel.breadth, height: parcel.height },
      },
      $push: { statusHistory: { status: "Return Approved", note: providerCalled ? "Reverse shipment created in Shiprocket" : "Existing Shiprocket return synced" } },
    }, { new: true, runValidators: true });
    if (!saved) throw new Error("The created return could not be saved. Retry to sync it.");
    return { order: saved, existing: !providerCalled };
  } catch (error) {
    const uncertain = Boolean(shipment) || ["creating", "reconcile"].includes(previousAttempt)
      || (providerCalled && ![400, 422].includes(error.providerStatus));
    await model.updateOne({ _id: order._id, "returnRequest.reverseCreationStatus": "creating" }, {
      $set: { "returnRequest.reverseCreationStatus": uncertain ? "reconcile" : "failed", "returnRequest.reverseCreationError": String(error.message).slice(0, 300) },
    }).catch(() => undefined);
    throw error;
  }
};
