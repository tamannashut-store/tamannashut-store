export async function migrateMarketplaceOwnership({ User, Product }) {
  const owner = await User.findOne({ isAdmin: true, sellerRole: { $ne: "member" } }).sort({ createdAt: 1 }).select("_id").lean();
  if (!owner) return { ownerFound: false, sellersSeparated: 0, productsAssigned: 0 };

  await User.updateMany(
    { isAdmin: true, sellerRole: { $ne: "member" }, accountType: { $ne: "platform_admin" } },
    { $set: { accountType: "platform_admin" } }
  );
  const sellers = await User.updateMany(
    { sellerRole: "member", $or: [{ isAdmin: true }, { accountType: { $ne: "seller" } }] },
    { $set: { isAdmin: false, accountType: "seller" }, $inc: { sessionVersion: 1 } }
  );
  const products = await Product.updateMany(
    { $or: [{ sellerId: { $exists: false } }, { sellerId: null }] },
    { $set: { sellerId: owner._id, approvalStatus: "not_required" } }
  );
  return { ownerFound: true, sellersSeparated: sellers.modifiedCount || 0, productsAssigned: products.modifiedCount || 0 };
}
