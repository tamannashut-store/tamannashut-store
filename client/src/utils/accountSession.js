export function accountTypeFromUser(user) {
  if (user?.accountType) return user.accountType;
  if (user?.isAdmin) return "platform_admin";
  if (user?.sellerRole === "member") return "seller";
  return "customer";
}

export function homeForAccount(user) {
  const type = accountTypeFromUser(user);
  if (type === "platform_admin") return "/admin/dashboard";
  if (type === "seller") return user?.sellerAccessStatus === "active" ? "/seller/dashboard" : "/seller/profile";
  return "/profile";
}

export function signInForAccount(user) {
  return accountTypeFromUser(user) === "customer" ? "/login" : "/admin-login";
}
