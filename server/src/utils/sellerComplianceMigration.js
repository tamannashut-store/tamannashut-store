import { effectiveSellerVerification } from "./sellerOnboarding.js";

export async function reconcileSellerCompliance({ User, SellerProfile, Product }) {
  const sellers = await User.find({ $or: [{ accountType: "seller" }, { sellerRole: "member" }] })
    .select("_id sellerAccessStatus")
    .lean();
  if (!sellers.length) return { sellersChecked: 0, listingsChanged: 0 };
  const profiles = await SellerProfile.find({ userId: { $in: sellers.map((seller) => seller._id) } }).lean();
  const profileBySeller = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  let listingsChanged = 0;
  for (const seller of sellers) {
    const profile = profileBySeller.get(String(seller._id));
    const compliant = seller.sellerAccessStatus === "active" && profile && effectiveSellerVerification(profile).status === "verified";
    const result = await Product.updateMany(
      { sellerId: seller._id, sellerComplianceHold: { $ne: !compliant } },
      { $set: { sellerComplianceHold: !compliant } },
    );
    listingsChanged += result.modifiedCount || 0;
  }
  return { sellersChecked: sellers.length, listingsChanged };
}
