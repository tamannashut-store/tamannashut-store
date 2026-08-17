export function loginPortalError(user, adminPortal) {
  if (adminPortal && !user?.isAdmin) return "This customer account does not have Seller Centre access";
  if (adminPortal && user?.isAdmin && user?.sellerAccessStatus && user.sellerAccessStatus !== "active") return "Your Seller Centre access is awaiting business verification";
  if (!adminPortal && user?.isAdmin) return "Administrator accounts must sign in through Seller Centre";
  return "";
}
