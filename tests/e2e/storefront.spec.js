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
    const { pathname } = new URL(route.request().url());
    let body = {};
    if (pathname.endsWith("/api/products")) body = { products: [product] };
    else if (pathname.endsWith("/api/social/instagram")) body = { posts: [] };
    else if (pathname.endsWith("/api/dashboard/notifications")) body = { orders: 3, reviews: 2, messages: 1 };
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
  await expect(page.getByRole("link", { name: /Orders 3 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Reviews 2 items need attention/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Messages 1 items need attention/ })).toBeVisible();
});
