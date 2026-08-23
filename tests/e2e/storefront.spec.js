import { expect, test } from "@playwright/test";

const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='750'%3E%3Crect width='100%25' height='100%25' fill='%23d9e6dc'/%3E%3C/svg%3E";
const product = {
  _id: "66aa11bb22cc33dd44ee55ff",
  slug: "regression-test-baby-outfit",
  name: "Regression Test Baby Outfit",
  category: "girls",
  price: 299,
  mrp: 999,
  stock: 8,
  images: [{ url: image, color: "Maroon", isCover: true }],
  variants: [{ sku: "TEST-MAR-03", size: "0-3M", color: "Maroon", price: 299, stock: 8 }],
  sizeStock: [{ size: "0-3M", stock: 8 }],
};
const codOrder = {
  _id: "77bb22cc33dd44ee55ff6600",
  userId: "test-user",
  customerName: "Test Customer",
  email: "test@example.com",
  phone: "9876543210",
  totalAmount: 299,
  paymentMethod: "COD",
  paymentStatus: "Pending",
  status: "Confirmed",
  createdAt: "2026-08-12T10:00:00.000Z",
  products: [{ _id: product._id, name: product.name, price: 299, qty: 1, selectedColor: "Maroon", selectedSize: "0-3M", sku: "TEST-MAR-03", image }],
  statusHistory: [{ status: "Pending", note: "Order placed", createdAt: "2026-08-12T10:00:00.000Z" }, { status: "Confirmed", note: "Status updated by admin", createdAt: "2026-08-12T10:05:00.000Z" }],
};
const supportContact = {
  _id: "66cc44dd55ee66ff77008899",
  customerId: "test-user",
  name: "Test Parent",
  email: "parent@example.com",
  topic: "order",
  orderReference: "B06F8E07",
  message: "Please check the delivery status for this order.",
  status: "open",
  readAt: null,
  customerLastReadAt: null,
  replies: [{ _id: "reply-admin-1", sender: "admin", body: "Your parcel is scheduled for dispatch tomorrow.", createdAt: "2026-08-22T10:03:00.000Z" }],
  createdAt: "2026-08-22T10:00:00.000Z",
  lastActivityAt: "2026-08-22T10:03:00.000Z",
};
const sellerSettlement = {
  _id: "88cc33dd44ee55ff66007711",
  sellerId: { _id: "seller-test", name: "Test Seller", email: "seller@example.com" },
  orderId: { _id: codOrder._id, status: "Delivered", createdAt: codOrder.createdAt, invoiceNumber: "TH-26-123" },
  status: "eligible", reconciliationStatus: "pending", grossAmount: 299, allocatedDiscount: 0,
  netSalesAmount: 299, commissionPercent: 10, commissionAmount: 29.9, refundAmount: 0,
  adjustmentAmount: -20, payableAmount: 249.1, payoutAttempts: [],
  adjustments: [{ _id: "adjustment-test", category: "shipping", amount: -20, note: "Seller shipping contribution" }],
};

async function mockApi(page) {
  // Intercept every API host so a developer's local .env can never make this
  // suite read from or write to production services.
  await page.route("**/api/**", async (route) => {
    const { pathname, searchParams } = new URL(route.request().url());
    const method = route.request().method();
    let body = {};
    if (pathname.endsWith("/api/products")) body = { products: [product], totalProducts: 1, searchMode: searchParams.get("search") === "maron" ? "fuzzy" : "exact" };
    else if (pathname.endsWith("/api/social/instagram")) body = { posts: [] };
    else if (pathname.endsWith("/api/dashboard/notifications")) body = { products: 4, orders: 3, reviews: 2, messages: 1 };
    else if (pathname.endsWith("/api/dashboard/operations")) body = { services: [], alerts: { failedRefunds: 0, pendingRefunds: 0, abandonedCarts: 4, recoveryEligible: 2 }, recentActivity: [] };
    else if (pathname.endsWith("/api/dashboard/cart-recoveries")) body = { recoveries: [{ id: "eligible-user", customer: "Test Customer", email: "te***@example.com", itemCount: 2, inactiveSince: "2026-08-11T10:00:00.000Z" }] };
    else if (pathname.endsWith("/api/dashboard/cart-recoveries/eligible-user/send")) body = { message: "Recovery email sent" };
    else if (pathname.endsWith("/api/dashboard/analytics")) body = {
      summary: { orders: 2, realizedRevenue: 299, averageOrderValue: 299, publishedProducts: 1 },
      dailySales: [{ date: "2026-08-11", revenue: 299, orders: 2, deliveredOrders: 1 }],
      statusBreakdown: [{ status: "Delivered", count: 1 }],
      paymentMix: [{ method: "COD", count: 1 }],
      topProducts: [], couponPerformance: [], recentOrders: [],
    };
    else if (pathname.endsWith("/api/settlements")) body = { settlements: [sellerSettlement], summary: { eligible: 249.1, processing: 0, failed: 0, held: 0, paid: 0 } };
    else if (pathname.endsWith("/api/auth/seller-team")) body = { sellers: [{ _id: "admin-test", name: "Store Owner", email: "admin@example.com", sellerRole: "owner", sellerAccessStatus: "active", profile: null }], invitations: [] };
    else if (pathname.endsWith("/api/orders/my-orders")) body = [codOrder];
    else if (pathname.endsWith("/api/orders")) body = [codOrder];
    else if (pathname.endsWith("/api/cart")) body = { items: [] };
    else if (pathname.endsWith("/api/auth/verify-email/resend")) body = { message: "A new verification link has been sent" };
    else if (pathname.endsWith("/api/auth/admin-login/verify")) body = { token: "safe-admin-token", user: { id: "admin-test", name: "Store Owner", email: "admin@example.com", isAdmin: true, sellerRole: "owner" } };
    else if (pathname.endsWith("/api/auth/admin-login/resend")) body = { requiresTwoFactor: true, challengeToken: "replacement-challenge", maskedEmail: "ad***@example.com" };
    else if (pathname.endsWith("/api/auth/admin-login")) body = { requiresTwoFactor: true, challengeToken: "safe-challenge", maskedEmail: "ad***@example.com" };
    else if (pathname.endsWith("/api/auth/login")) body = { token: "safe-local-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } };
    else if (pathname.endsWith(`/api/contacts/mine/${supportContact._id}/replies`) && method === "POST") body = { ...supportContact, status: "open", customerLastReadAt: "2026-08-22T10:06:00.000Z", replies: [...supportContact.replies, { _id: "reply-customer-1", sender: "customer", body: "Thank you for the update.", createdAt: "2026-08-22T10:06:00.000Z" }] };
    else if (pathname.endsWith(`/api/contacts/mine/${supportContact._id}`)) body = { ...supportContact, customerLastReadAt: "2026-08-22T10:05:00.000Z" };
    else if (pathname.endsWith("/api/contacts/mine")) body = [supportContact];
    else if (pathname.endsWith(`/api/contacts/${supportContact._id}/replies`) && method === "POST") body = { ...supportContact, readAt: "2026-08-22T10:05:00.000Z", status: "in_progress", replies: [...supportContact.replies, { _id: "reply-admin-2", sender: "admin", body: "We have confirmed the dispatch schedule.", createdAt: "2026-08-22T10:07:00.000Z" }] };
    else if (pathname.endsWith("/api/contacts") && method === "POST") body = { success: true, message: "Message sent successfully", reference: "B06F8E07", accountLinked: true };
    else if (pathname.endsWith("/api/contacts")) body = [supportContact];
    else if (pathname.endsWith(`/api/contacts/${supportContact._id}/read`)) body = { ...supportContact, readAt: "2026-08-22T10:05:00.000Z" };
    else if (pathname.endsWith(`/api/contacts/${supportContact._id}/status`)) body = { ...supportContact, readAt: "2026-08-22T10:05:00.000Z", status: "in_progress" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("storefront renders catalogue data without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Beautiful clothes for their biggest little moments." })).toBeVisible();
  await expect(page.getByRole("heading", { name: product.name }).first()).toBeVisible();
  await expect(page.locator(`a[href="/product/${product.slug}"]`).first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("seller registration is invitation-only", async ({ page }) => {
  await page.goto("/seller/register");
  await expect(page.getByRole("heading", { name: "Invitation required" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to seller sign in" })).toHaveAttribute("href", "/admin-login");
});

test("store owner can open the seller invitation workspace", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true, sellerRole: "owner" } })));
  await page.goto("/admin/team");
  await expect(page.getByRole("heading", { name: "Seller team" })).toBeVisible();
  await expect(page.getByPlaceholder("seller@example.com")).toBeVisible();
  await expect(page.getByText("Platform administrator and catalogue owner")).toBeVisible();
});

test("mobile navigation exposes storefront and account destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Girls" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Cart" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("unknown storefront URLs show a useful 404 page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shop products" })).toHaveAttribute("href", "/shop");
  await expect(page).toHaveURL(/this-page-does-not-exist$/);
});

test("help centre provides searchable answers and a support path", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "How can we help?" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("searchbox", { name: "Search help articles" }).fill("COD order paid");
  await page.getByRole("button", { name: "When is a COD order paid?" }).click();
  await expect(page.getByText(/Cash-on-delivery payment remains pending/)).toBeVisible();
  await expect(page.getByRole("status")).toContainText("1 answer available");
  await expect(page.getByRole("link", { name: "Support requests" })).toHaveAttribute("href", "/support");
});

test("admin support inbox keeps unread requests actionable until opened", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true, accountType: "platform_admin", sellerRole: "owner" } })));
  await page.goto("/admin/contacts");
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  const request = page.getByRole("button", { name: /Test Parent/ });
  await expect(request.getByText("New", { exact: true })).toBeVisible();
  await request.click();
  await expect(page.locator(`#support-${supportContact._id}`).getByText("Please check the delivery status for this order.", { exact: true })).toBeVisible();
  await page.getByLabel("Request status").selectOption("in_progress");
  await expect(page.getByLabel("Request status")).toHaveValue("in_progress");
  await page.getByLabel("Reply to customer").fill("We have confirmed the dispatch schedule.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("We have confirmed the dispatch schedule.")).toBeVisible();
});

test("customer support portal keeps replies private and usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Parent", email: "parent@example.com", accountType: "customer" } })));
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "Support requests" })).toBeVisible();
  await expect(page.getByText("Your parcel is scheduled for dispatch tomorrow.").last()).toBeVisible();
  await page.getByLabel("Reply securely").fill("Thank you for the update.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Thank you for the update.").last()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("storefront offers a keyboard-accessible skip link", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "How can we help?" })).toBeVisible();
  await page.locator("body").press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("order support links prefill the contact topic and reference", async ({ page }) => {
  await page.goto("/contact?topic=order&order=B06F8E07");
  await expect(page.getByLabel("Support topic")).toHaveValue("order");
  await expect(page.getByLabel(/Order number/)).toHaveValue("B06F8E07");
  await expect(page.getByLabel("Breadcrumb").getByRole("link", { name: "Help Centre" })).toHaveAttribute("href", "/help");
});

test("contact support returns an accessible case reference", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Parent", email: "parent@example.com" } })));
  await page.goto("/contact?topic=order&order=B06F8E07");
  await expect(page.getByLabel("Your name")).toHaveValue("Test Parent");
  await expect(page.getByLabel("Email address")).toHaveValue("parent@example.com");
  await page.getByLabel("How can we help?").fill("Please check the current delivery status.");
  await page.getByRole("button", { name: "Send support request" }).click();
  await expect(page.getByRole("region", { name: "Send a secure request" }).getByRole("status")).toContainText("Support reference: B06F8E07");
  await expect(page.getByRole("link", { name: "View support requests" })).toHaveAttribute("href", "/support");
});

test("corrupted browser storage is cleared without crashing the storefront", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("user", "{broken-session");
    localStorage.setItem("guest_cart", "{broken-cart");
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Beautiful clothes for their biggest little moments." })).toBeVisible();
  await expect(page.getByText("This page could not be displayed")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("user"))).toBeNull();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("guest_cart") || "[]"))).toEqual([]);
});

test("an expired saved session does not block the public storefront", async ({ page }) => {
  await page.addInitScript(() => {
    const encode = (value) => btoa(JSON.stringify(value));
    const token = `${encode({ alg: "none" })}.${encode({ exp: 1 })}.signature`;
    localStorage.setItem("user", JSON.stringify({ token, user: { id: "expired-user", email: "expired@example.com", isAdmin: false } }));
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Beautiful clothes for their biggest little moments." })).toBeVisible();
  await expect(page.getByText("This page could not be displayed")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("user"))).toBeNull();
});

test("login offers recovery and registration and accepts a safe mocked session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.getByPlaceholder("Enter your password").fill("safe-password");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "null")?.user?.email)).toBe("test@example.com");
});

test("registration makes shopping email consent optional", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Join Tamanna's Hut" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  const consent = page.getByRole("checkbox", { name: /Helpful shopping emails/ });
  await expect(consent).toBeVisible();
  await expect(consent).not.toBeChecked();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /I accept the Terms/ })).toBeVisible();
});

test("Seller Centre sign in requires the emailed security code", async ({ page }) => {
  await page.goto("/admin-login");
  await page.getByLabel("Seller Centre email").fill("admin@example.com");
  await page.getByPlaceholder("Enter your password").fill("SafePassword42");
  await page.getByRole("button", { name: "Continue securely" }).click();
  await expect(page.getByLabel("Security code")).toBeVisible();
  await expect(page.getByText(/ad\*\*\*@example\.com/)).toBeVisible();
  await page.getByLabel("Security code").fill("123456");
  await page.getByRole("button", { name: "Verify and open Seller Centre" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});

test("email verification page supports resending an activation link", async ({ page }) => {
  await page.goto("/verify-email?email=new@example.com");
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expect(page.getByLabel("Account email")).toHaveValue("new@example.com");
  await page.getByRole("button", { name: "Send a new verification link" }).click();
  await expect(page.getByRole("status")).toContainText(/verification/i);
});

test("password recovery screens provide clear safe paths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("link", { name: "Customer sign in" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Seller Centre sign in" })).toHaveAttribute("href", "/admin-login");

  await page.goto("/reset-password/sample-token");
  await page.getByPlaceholder("At least 8 characters").fill("SecurePass42");
  await page.getByPlaceholder("Enter it again").fill("DifferentPass42");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page.getByRole("alert")).toContainText("do not match");
});

test("changing a password clears the current browser session", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } })));
  await page.goto("/change-password");
  await page.getByLabel("Current password", { exact: true }).fill("OldPassword42");
  await page.getByLabel("New password", { exact: true }).fill("NewPassword42");
  await page.getByLabel("Confirm new password", { exact: true }).fill("NewPassword42");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("user"))).toBeNull();
});

test("guest cart preserves the selected colour image on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((item) => localStorage.setItem("guest_cart", JSON.stringify([{ ...item, selectedColor: "Maroon", selectedSize: "0-3M", selectedSku: "TEST-MAR-03", qty: 1, image: item.images[0].url }])), product);
  await page.goto("/cart");
  await expect(page.getByText("Colour: Maroon")).toBeVisible();
  await expect(page.getByRole("img", { name: product.name })).toHaveAttribute("src", image);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("authenticated mobile checkout renders the selected variant and required delivery fields", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cartItem = { ...product, selectedColor: "Maroon", selectedSize: "0-3M", selectedSku: "TEST-MAR-03", qty: 1, image: product.images[0].url };
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "checkout-test", name: "Test Customer", email: "test@example.com", phone: "9876543210", address: "Test address", pincode: "711310", city: "Howrah", state: "West Bengal", country: "India", isAdmin: false } })));
  await page.route("**/api/cart", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [cartItem] }) }));
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Delivery and payment" })).toBeVisible();
  await expect(page.getByRole("img", { name: product.name })).toHaveAttribute("src", image);
  await expect(page.getByText("Maroon · Size 0-3M · Qty 1")).toBeVisible();
  for (const label of ["Recipient full name", "Email", "Phone number", "Pincode", "City", "State", "Country", /House, street and landmark/]) await expect(page.getByLabel(label)).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("COD confirmation says order placed and payment pending", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("last_order_confirmation", JSON.stringify({ paymentMethod: "COD", orderId: "66aa11bb22cc33dd44ee55ff", total: 299, createdAt: Date.now() })));
  await page.goto("/success");
  await expect(page.getByRole("heading", { name: "Your order is placed" })).toBeVisible();
  await expect(page.getByText("Cash on delivery · Payment pending")).toBeVisible();
  await expect(page.getByText("Payment successful")).toHaveCount(0);
});

test("customer orders identify COD as unpaid until delivery collection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } })));
  await page.goto("/my-orders");
  await expect(page.getByText("Cash on delivery · Payment pending")).toBeVisible();
  await expect(page.getByText("Paid online")).toHaveCount(0);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("cancelled COD orders say that no payment was collected", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } })));
  await page.route("**/api/orders/my-orders", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ ...codOrder, status: "Cancelled" }]) }));
  await page.goto("/my-orders");
  await expect(page.getByText("Cash on delivery · No payment collected")).toBeVisible();
  await expect(page.getByText("Cash on delivery · Payment pending")).toHaveCount(0);
});

test("seller orders distinguish COD collection from online payment", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/orders");
  await expect(page.getByText("Cash on delivery", { exact: true })).toBeVisible();
  await expect(page.getByText("Collect on delivery")).toBeVisible();
  await expect(page.getByText("Online payment")).toHaveCount(0);
});

test("direct confirmation visits never claim a successful payment", async ({ page }) => {
  await page.goto("/success");
  await expect(page.getByRole("heading", { name: "Open your orders to confirm status" })).toBeVisible();
  await expect(page.getByText("Payment successful")).toHaveCount(0);
});

test("seller sidebar shows actionable notification counts", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/orders");
  await expect(page.getByRole("link", { name: /Products 4 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders 3 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Reviews 2 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Messages 1 items need attention/ })).toBeVisible();
});

test("Seller Centre navigation scrolls on a short desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 420 });
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true, accountType: "platform_admin" } })));
  await page.goto("/admin/orders");
  const navigation = page.getByRole("navigation", { name: "Seller Centre navigation" });
  await expect(navigation).toBeVisible();
  const dimensions = await navigation.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(dimensions.overflowY).toBe("auto");
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  await page.getByRole("link", { name: "Seller team" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: "Seller team" })).toBeVisible();
});

test("seller overview renders analytics without a runtime error", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/dashboard");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Realized revenue")).toBeVisible();
  await expect(page.getByRole("button", { name: "Orders" })).toBeVisible();
  await page.getByRole("button", { name: "Orders" }).click();
  await expect(page.getByLabel("Daily orders chart")).toBeVisible();
  await expect(page.getByText("This page could not be displayed")).toHaveCount(0);
});

test("shop explains when typo-tolerant results are shown", async ({ page }) => {
  await page.goto("/shop?search=maron");
  await expect(page.getByText("Showing close matches for “maron”.")).toBeVisible();
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
});

test("seller operations distinguishes saved carts from consent-eligible recoveries", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/operations");
  await expect(page.getByText("Saved carts inactive for 2+ hours")).toBeVisible();
  await expect(page.getByText("Consent-eligible recoveries")).toBeVisible();
  await expect(page.getByText("No recovery message is sent automatically.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send one reminder" })).toBeVisible();
});

test("shop recovers automatically when the catalogue service is waking up", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/products?**", async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Service is starting" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ products: [product], totalProducts: 1, totalPages: 1, searchMode: "exact" }),
    });
  });

  await page.goto("/shop");
  await expect(page.getByText("The store is waking up", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("1 products found")).toBeVisible();
  expect(requests).toBe(2);
});

test("admin settlement reconciliation shows an auditable payout action", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/settlements");
  await expect(page.getByRole("heading", { name: "Seller settlements" })).toBeVisible();
  await expect(page.getByText("Test Seller")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start payout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Statement" })).toBeVisible();
  await expect(page.getByText("Adjustment ledger (1)")).toBeVisible();
});
