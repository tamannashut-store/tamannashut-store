// Planning only: never infer a provider location from a seller's display name.
// The caller must verify the configured location against Shiprocket before use.
export const planSellerPickup = (order, mappings = {}) => {
  const fail = (message) => { throw Object.assign(new Error(message), { status: 409 }); };
  const fulfillments = order.sellerFulfillments || [];
  if (fulfillments.length !== 1) fail("A single seller fulfilment is required; mixed orders need separate shipments.");
  const sellerId = String(fulfillments[0].sellerId?._id || fulfillments[0].sellerId || "");
  const products = order.products || [];
  if (!sellerId || !products.length || products.some((item) => String(item.sellerId?._id || item.sellerId || "") !== sellerId)) {
    fail("Every order item must belong to the selected seller before creating a shipment.");
  }
  const mapping = Object.hasOwn(mappings, sellerId) ? mappings[sellerId] : null;
  const location = typeof mapping?.location === "string" ? mapping.location.trim() : "";
  const postcode = String(mapping?.postcode || "").trim();
  const snapshotPostcode = String(fulfillments[0].pickupAddress?.pincode || "").trim();
  if (!location || location.length > 100 || !/^[1-9]\d{5}$/.test(postcode)) fail("This seller has no valid Shiprocket pickup mapping.");
  if (!snapshotPostcode || snapshotPostcode !== postcode) fail("The mapped pickup pincode does not match the order's seller pickup address.");
  return { sellerId, location, postcode };
};
