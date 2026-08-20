export const STOREFRONT_APPROVAL_STATES = Object.freeze(["approved", "not_required"]);

// Deliberately contains no sellerId condition: the customer catalogue combines
// every platform and marketplace-seller listing after platform approval.
export const storefrontProductFilter = (filter = {}) => ({
  ...filter,
  status: "active",
  approvalStatus: { $in: [...STOREFRONT_APPROVAL_STATES] },
  sellerComplianceHold: { $ne: true },
});

export const isStorefrontProduct = (product) => (
  product?.status === "active"
  && STOREFRONT_APPROVAL_STATES.includes(product?.approvalStatus)
  && product?.sellerComplianceHold !== true
);
