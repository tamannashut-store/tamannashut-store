export const ACCOUNT_TYPES = Object.freeze({
  CUSTOMER: "customer",
  PLATFORM_ADMIN: "platform_admin",
  SELLER: "seller",
});

// sellerRole is retained while existing production accounts are migrated.
export const accountTypeFor = (user) => {
  if (user?.accountType && Object.values(ACCOUNT_TYPES).includes(user.accountType)) {
    return user.accountType;
  }
  if (user?.sellerRole === "member") return ACCOUNT_TYPES.SELLER;
  if (user?.isAdmin) return ACCOUNT_TYPES.PLATFORM_ADMIN;
  return ACCOUNT_TYPES.CUSTOMER;
};

export const isPlatformAdmin = (user) => accountTypeFor(user) === ACCOUNT_TYPES.PLATFORM_ADMIN;
export const isMarketplaceSeller = (user) => accountTypeFor(user) === ACCOUNT_TYPES.SELLER;
export const hasActiveSellerCentreAccess = (user) => (
  (isPlatformAdmin(user) || isMarketplaceSeller(user))
  && (!user?.sellerAccessStatus || user.sellerAccessStatus === "active")
);

export const scopeSellerOwned = (user, filter = {}, field = "sellerId") => (
  isMarketplaceSeller(user) ? { ...filter, [field]: user._id } : { ...filter }
);

export const publicAccount = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: isPlatformAdmin(user),
  accountType: accountTypeFor(user),
  sellerRole: user.sellerRole || "",
  sellerAccessStatus: user.sellerAccessStatus || "active",
});
