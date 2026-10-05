const providerId = (value) => /^\d+$/.test(String(value || "")) && Number(value) > 0 ? String(value) : "";

export const shiprocketShipment = (payload) => {
  const envelopes = [payload?.response?.data, payload?.data, payload?.response, payload];
  for (const envelope of envelopes) {
    for (const item of Array.isArray(envelope) ? envelope : [envelope]) {
      if (!item || typeof item !== "object") continue;
      const shipment = Array.isArray(item.shipments) ? item.shipments[0] : item.shipments;
      const shipmentId = providerId(item.shipment_id || shipment?.id || shipment?.shipment_id);
      if (shipmentId) return {
        shipmentId,
        orderId: providerId(item.order_id || item.id),
        awb: String(item.awb_code || shipment?.awb || shipment?.awb_code || ""),
      };
    }
  }
  return null;
};

export const requirePickupSuccess = (payload) => {
  if (Number(payload?.pickup_status ?? payload?.response?.pickup_status ?? payload?.data?.pickup_status) !== 1) {
    throw Object.assign(new Error(payload?.message || payload?.response?.message || "Shiprocket has not confirmed pickup. Check the assigned AWB and retry."), { status: 502 });
  }
};
