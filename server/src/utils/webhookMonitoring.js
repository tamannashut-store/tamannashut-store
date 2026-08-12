export const shiprocketWebhookContext = (payload = {}) => ({
  shipmentId: String(payload.shipment_id || "").slice(0, 80),
  statusId: String(payload.current_status_id ?? payload.shipment_status_id ?? payload.status_id ?? "").slice(0, 40),
  hasAwb: Boolean(payload.awb || payload.awb_code),
});
