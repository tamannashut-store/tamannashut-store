import { accountTypeFor, ACCOUNT_TYPES, hasActiveSellerCentreAccess } from "./accountRoles.js";

export function loginPortalError(user, adminPortal) {
  const accountType = accountTypeFor(user);
  if (adminPortal && accountType === ACCOUNT_TYPES.CUSTOMER) return "This customer account does not have Seller Centre access";
  if (adminPortal && accountType === ACCOUNT_TYPES.PLATFORM_ADMIN && !hasActiveSellerCentreAccess(user)) return "Your Seller Centre access is unavailable";
  if (adminPortal && accountType === ACCOUNT_TYPES.SELLER && ["closed", "suspended"].includes(user?.sellerAccessStatus)) return "Your Seller Centre access is unavailable. Contact marketplace support";
  if (!adminPortal && accountType !== ACCOUNT_TYPES.CUSTOMER) return "Seller Centre accounts must sign in through Seller Centre";
  return "";
}
