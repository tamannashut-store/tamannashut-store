import { ENROLMENT_SELLER_ID } from "./enrolmentSeller.js";

// The legacy shipping adapter supports only the platform warehouse. Seller
// fulfilment snapshots are not a Shiprocket pickup-location mapping.
export const requirePlatformPickupOrder = (order) => {
  const hasLegacyEnrolmentItems = (order.products || []).some((item) =>
    String(item.sellerId?._id || item.sellerId || "") === ENROLMENT_SELLER_ID);
  if ((order.sellerFulfillments || []).length || order.enrolmentSupplier || hasLegacyEnrolmentItems) {
    throw Object.assign(new Error("Seller-specific pickup routing is not configured. Arrange this seller's shipment from the correct verified pickup address in Shiprocket; do not use the platform warehouse."), { status: 409 });
  }
};
