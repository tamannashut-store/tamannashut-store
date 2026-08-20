export const AD_PACKAGES = Object.freeze({
  starter: Object.freeze({ label: "Starter", days: 3, amount: 299 }),
  growth: Object.freeze({ label: "Growth", days: 7, amount: 599 }),
  boost: Object.freeze({ label: "Boost", days: 14, amount: 999 }),
});

export const AD_PLACEMENTS = Object.freeze(["home", "shop"]);

export const isAdEligibleProduct = (product, sellerId) => (
  String(product?.sellerId || "") === String(sellerId || "")
  && product?.status === "active"
  && ["approved", "not_required"].includes(product?.approvalStatus)
  && product?.sellerComplianceHold !== true
);

export const isLiveCampaign = (campaign, now = new Date()) => (
  campaign?.status === "active"
  && new Date(campaign.startsAt) <= now
  && new Date(campaign.endsAt) > now
);
