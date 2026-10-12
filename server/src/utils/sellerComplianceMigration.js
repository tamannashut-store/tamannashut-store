import { effectiveSellerVerification } from "./sellerOnboarding.js";
import { isPlatformAdmin } from "./accountRoles.js";

export async function reconcileSellerCompliance({ User, SellerProfile, Product }) {
  const sellers = await User.find({ $or: [{ accountType: "seller" }, { sellerRole: "member" }] })
    .select("_id sellerAccessStatus accountType sellerRole isAdmin")
    .lean();
  if (!sellers.length) return { sellersChecked: 0, listingsChanged: 0 };
  const profiles = await SellerProfile.find({ userId: { $in: sellers.map((seller) => seller._id) } }).lean();
  const profileBySeller = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  let listingsChanged = 0;
  for (const seller of sellers) {
    if (isPlatformAdmin(seller)) continue;
    const profile = profileBySeller.get(String(seller._id));
    if (seller.sellerAccessStatus === "active" && (!profile?.bankProof?.digest || !profile?.bankProof?.uploadedAt)) {
      await User.updateOne({ _id: seller._id, sellerAccessStatus: "active" }, { $set: { sellerAccessStatus: "pending" } });
      seller.sellerAccessStatus = "pending";
    }
    const compliant = seller.sellerAccessStatus === "active" && profile && effectiveSellerVerification(profile).status === "verified";
    const result = await Product.updateMany(
      { sellerId: seller._id, sellerComplianceHold: { $ne: !compliant } },
      { $set: { sellerComplianceHold: !compliant } },
    );
    listingsChanged += result.modifiedCount || 0;
  }
  return { sellersChecked: sellers.length, listingsChanged };
}
