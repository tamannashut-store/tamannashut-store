import User from "../models/User.js";
import SellerProfile from "../models/SellerProfile.js";
import { isMarketplaceSeller, isPlatformAdmin } from "./accountRoles.js";
import { effectiveSellerVerification } from "./sellerOnboarding.js";
import { slugifyProductName } from "./productSlug.js";

export const publicSellerStore = async (identifier, { Users = User, Profiles = SellerProfile } = {}) => {
  const id = String(identifier?._id || identifier || "");
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const user = await Users.findById(id).select("accountType sellerRole sellerAccessStatus isAdmin").lean();
  if (!user || ["closed", "suspended"].includes(user.sellerAccessStatus)) return null;
  let name;
  if (isPlatformAdmin(user)) name = "Tamanna's Hut";
  else if (isMarketplaceSeller(user) && user.sellerAccessStatus === "active") {
    const profile = await Profiles.findOne({ userId: id }).lean();
    if (!profile || effectiveSellerVerification(profile).status !== "verified") return null;
    name = String(profile.tradeName || "").trim();
  }
  if (!name) return null;
  const slug = slugifyProductName(name);
  // Publish only storefront identity, never legal, contact or bank details.
  return { id, name, slug, path: `/store/${id}/${slug}` };
};
