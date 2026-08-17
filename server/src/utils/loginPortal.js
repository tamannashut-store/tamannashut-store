import { accountTypeFor, ACCOUNT_TYPES, hasActiveSellerCentreAccess } from "./accountRoles.js";

export function loginPortalError(user, adminPortal) {
  const accountType = accountTypeFor(user);
  if (adminPortal && accountType === ACCOUNT_TYPES.CUSTOMER) return "This customer account does not have Seller Centre access";
  if (adminPortal && !hasActiveSellerCentreAccess(user)) return "Your Seller Centre access is awaiting business verification";
  if (!adminPortal && accountType !== ACCOUNT_TYPES.CUSTOMER) return "Seller Centre accounts must sign in through Seller Centre";
  return "";
}
