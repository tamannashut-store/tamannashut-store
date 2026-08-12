import { expect, test } from "@playwright/test";

const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='750'%3E%3Crect width='100%25' height='100%25' fill='%23d9e6dc'/%3E%3C/svg%3E";
const product = {
  _id: "66aa11bb22cc33dd44ee55ff",
  name: "Regression Test Baby Outfit",
  category: "girls",
  price: 299,
  mrp: 999,
  stock: 8,
  images: [{ url: image, color: "Maroon", isCover: true }],
  variants: [{ sku: "TEST-MAR-03", size: "0-3M", color: "Maroon", price: 299, stock: 8 }],
  sizeStock: [{ size: "0-3M", stock: 8 }],
};

async function mockApi(page) {
  // Intercept every API host so a developer's local .env can never make this
  // suite read from or write to production services.
  await page.route("**/api/**", async (route) => {
    const { pathname, searchParams } = new URL(route.request().url());
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
    else if (pathname.endsWith("/api/orders")) body = [];
    else if (pathname.endsWith("/api/cart")) body = { items: [] };
    else if (pathname.endsWith("/api/auth/login")) body = { token: "safe-local-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } };
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
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
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

test("login offers recovery and registration and accepts a safe mocked session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  await page.getByPlaceholder("Email").fill("test@example.com");
  await page.getByPlaceholder("Password").fill("safe-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "null")?.user?.email)).toBe("test@example.com");
});

test("registration makes shopping email consent optional", async ({ page }) => {
  await page.goto("/register");
  const consent = page.getByRole("checkbox", { name: /Helpful shopping emails/ });
  await expect(consent).toBeVisible();
  await expect(consent).not.toBeChecked();
});

test("changing a password clears the current browser session", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-customer-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } })));
  await page.goto("/change-password");
  await page.getByPlaceholder("Current Password").fill("old-password");
  await page.getByPlaceholder("New Password").fill("new-password");
  await page.getByPlaceholder("Confirm Password").fill("new-password");
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

test("seller sidebar shows actionable notification counts", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.goto("/admin/orders");
  await expect(page.getByRole("link", { name: /Products 4 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders 3 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Reviews 2 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Messages 1 items need attention/ })).toBeVisible();
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
