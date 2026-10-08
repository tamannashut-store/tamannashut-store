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
    else if (pathname.endsWith("/api/auth/phone-login/send")) body = { challengeToken: "safe-phone-challenge", message: "Login code sent to your mobile number" };
    else if (pathname.endsWith("/api/auth/phone-login/check")) body = { token: "safe-local-token", user: { id: "test-user", name: "Test Customer", email: "test@example.com", isAdmin: false } };
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

test("approved ratings and review counts appear on home, shop, wishlist and recommendations", async ({ page }) => {
  const rated = { ...product, averageRating: 4.6, approvedReviewCount: 8 };
  await page.route(/\/api\/products(?:\?.*)?$/, route => route.fulfill({ json: { products: [rated], totalProducts: 1 } }));
  await page.route(`**/api/products/${product.slug}`, route => route.fulfill({ json: rated }));
  await page.goto("/");
  const featured = page.getByRole("region", { name: "Featured products" });
  await expect(featured.getByText("4.6", { exact: true })).toBeVisible();
  await expect(featured.getByText("(8 reviews)", { exact: true })).toBeVisible();
  await featured.getByRole("button", { name: `Save ${product.name}` }).click();
  await page.goto("/wishlist");
  await expect(page.getByText("(8 reviews)", { exact: true })).toBeVisible();
  await page.goto("/shop");
  await expect(page.getByText("4.6", { exact: true })).toBeVisible();
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByRole("link", { name: "Rated 4.6 out of 5 from 8 approved reviews" })).toHaveAttribute("href", "#reviews");
  const other = { ...rated, _id: "related-rated", slug: "related-rated", name: "Reviewed recommendation" };
  await page.route(`**/api/products/${product._id}/related`, route => route.fulfill({ json: { products: [other] } }));
  await page.reload();
  await expect(page.getByRole("link", { name: /Reviewed recommendation/ }).filter({ visible: true }).getByText("(8 reviews)", { exact: true })).toBeVisible();
});

test("unreviewed listings never show an invented zero-star or cached rating", async ({ page }) => {
  await page.route(/\/api\/products(?:\?.*)?$/, route => route.fulfill({ json: { products: [{ ...product, averageRating: 5, approvedReviewCount: 0 }], totalProducts: 1 } }));
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Featured products" }).getByText("No reviews yet", { exact: true })).toBeVisible();
  await page.goto("/shop");
  await expect(page.getByText("No reviews yet", { exact: true })).toBeVisible();
  await expect(page.getByText("0.0", { exact: true })).toHaveCount(0);
  await expect(page.getByText("5.0", { exact: true })).toHaveCount(0);
});

test("product purchase uses active SKU stock and requires a deliberate option choice", async ({ page }) => {
  const item = { ...product, optionLabel: "Capacity", sizeStock: [], variants: [{ sku: "ONE-LITRE", size: "1 litre", price: 449, stock: 1, color: "" }, { sku: "HIDDEN", size: "2 litres", price: 599, stock: 9, active: false }] };
  await page.route(`**/api/products/${product.slug}`, route => route.fulfill({ json: item }));
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText("In stock", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 litres", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("guest_cart") || "[]").length)).toBe(0);
  await page.getByRole("button", { name: "1 litre", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("guest_cart") || "[]")[0]?.price)).toBe(449);
  await expect(page.getByRole("button", { name: "Add to bag", exact: true })).toBeDisabled();
});

test("product navigation failure clears the previous product and supports retry", async ({ page }) => {
  const next = { ...product, _id: "next-product", slug: "next-product", name: "Next product" };
  let failed = true;
  await page.route(`**/api/products/${product.slug}`, route => route.fulfill({ json: product }));
  await page.route(`**/api/products/${product._id}/related`, route => route.fulfill({ json: { products: [next] } }));
  await page.route("**/api/products/next-product", route => route.fulfill(failed ? { status: 503, json: { message: "Unavailable" } } : { json: next }));
  await page.goto(`/product/${product.slug}`);
  await page.getByRole("link", { name: /Next product/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Product unavailable" })).toBeVisible();
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: next.name, exact: true })).toBeVisible();
});

test("mobile product page checks prepaid and COD delivery and clears stale results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  await page.route(`**/api/products/${product.slug}`, route => route.fulfill({ json: product }));
  let modes = [];
  await page.route("**/api/logistics/postcode/**", route => { const url = new URL(route.request().url()); modes.push(url.searchParams.get("cod")); return route.fulfill({ json: { pincode: "711310", city: "Howrah", state: "West Bengal", serviceable: true } }); });
  await page.goto(`/product/${product.slug}`);
  const delivery = page.getByRole("region", { name: "Delivery and returns" });
  await delivery.getByLabel("Check delivery to your pincode").fill("711310");
  await delivery.getByRole("button", { name: "Check", exact: true }).click();
  await expect(delivery.getByRole("status")).toContainText("Prepaid delivery available to Howrah");
  await delivery.getByLabel("Check cash on delivery availability").check();
  await expect(delivery.getByRole("status")).toHaveCount(0);
  await delivery.getByRole("button", { name: "Check", exact: true }).click();
  await expect(delivery.getByRole("status")).toContainText("Cash on delivery available");
  expect(modes).toEqual(["0", "1"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await expect(page.getByRole("img", { name: `${product.name} view 1` })).toHaveCSS("object-fit", "contain");
});

test("failed customer order loading shows retry instead of an empty purchase history", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  let failed = true;
  await page.route("**/api/orders/my-orders", route => route.fulfill(failed ? { status: 503, json: { message: "Unavailable" } } : { json: [codOrder] }));
  await page.goto("/my-orders");
  await expect(page.getByRole("alert")).toContainText("couldn't load your orders");
  await expect(page.getByRole("heading", { name: "No orders yet" })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Cash on delivery · Payment pending")).toBeVisible();
});

test("customer return journey displays review, reverse tracking and refund completion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  let order = { ...codOrder, status: "Delivered", paymentStatus: "Paid", statusHistory: [{ status: "Delivered", createdAt: new Date().toISOString() }] };
  await page.route("**/api/orders/my-orders", route => route.fulfill({ json: [order] }));
  await page.route(`**/api/orders/return/${order._id}`, route => { expect(route.request().postData()).toContain("The item arrived damaged"); order = { ...order, status: "Return Requested", returnRequest: { reason: "The item arrived damaged", reviewStatus: "Pending" } }; return route.fulfill({ json: { success: true, order } }); });
  await page.goto("/my-orders");
  await page.getByRole("button", { name: "Request return", exact: true }).click();
  await page.getByLabel("Reason for return").fill("The item arrived damaged");
  await page.getByRole("button", { name: "Submit request", exact: true }).click();
  const progress = page.getByRole("region", { name: "Return and refund progress" });
  await expect(progress).toContainText("Your request is being reviewed");
  order = { ...order, status: "Return Approved", returnRequest: { ...order.returnRequest, reverseAwb: "RET123", reverseCourierName: "Test Courier", reversePickupScheduled: true } };
  await page.reload();
  await expect(progress).toContainText("Return pickup scheduled");
  await expect(progress.getByRole("link", { name: "Track return package" })).toHaveAttribute("href", /tracking_id=RET123$/);
  order = { ...order, status: "Refunded", paymentStatus: "Refunded", refund: { status: "Processed", amount: 299, method: "UPI", reference: "REFUND-TEST" } };
  await page.reload();
  await expect(progress).toContainText("Your refund is completed");
  await expect(page.getByText("Cash on delivery · Refunded")).toBeVisible();
  await expect(page.getByRole("region", { name: "Refund payment details" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("expired delivered orders explain the closed return window", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  await page.route("**/api/orders/my-orders", route => route.fulfill({ json: [{ ...codOrder, status: "Delivered", statusHistory: [{ status: "Delivered", createdAt: new Date(Date.now() - 8 * 86400000).toISOString() }] }] }));
  await page.goto("/my-orders");
  await expect(page.getByText(/7-day online return window has closed/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Request return", exact: true })).toHaveCount(0);
});

test("refund details lookup failure cannot overwrite saved details and can be retried", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  await page.route("**/api/orders/my-orders", route => route.fulfill({ json: [{ ...codOrder, status: "Refund Pending", paymentStatus: "Paid" }] }));
  let failed = true;
  await page.route(`**/api/orders/refund-details/${codOrder._id}`, route => route.fulfill(failed ? { status: 503, json: { message: "Unavailable" } } : { json: { submitted: true, method: "UPI", maskedDestination: "te***@bank" } }));
  await page.goto("/my-orders");
  await expect(page.getByRole("alert")).toContainText("could not be checked");
  await expect(page.getByLabel("UPI ID", { exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Retry saved details" }).click();
  await expect(page.getByRole("heading", { name: "Refund details received" })).toBeVisible();
});

test("home categories come from the full published catalogue", async ({ page }) => {
  await page.route("**/api/products/categories", (route) => route.fulfill({ json: { categories: [{ key: "home-kitchen", label: "Home & Kitchen", count: 4, image }, { key: "electronics", label: "Electronics", count: 2, image }] } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Home & Kitchen 4 products/ })).toHaveAttribute("href", "/shop?category=home-kitchen");
  await expect(page.getByRole("link", { name: /Electronics 2 products/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("marketplace home keeps product photos fully visible and offers direct search", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const photo = page.getByRole("region", { name: "Featured products" }).getByRole("img", { name: `${product.name} view 1`, exact: true }).first();
  await expect(photo).toBeVisible();
  const framing = await photo.evaluate((element) => ({ fit: getComputedStyle(element).objectFit, padding: getComputedStyle(element).padding, height: element.getBoundingClientRect().height }));
  expect(framing.fit).toBe("contain");
  expect(framing.padding).toBe("0px");
  expect(framing.height).toBeLessThanOrEqual(300);
  await expect(page.getByText("Home & kitchen", { exact: true })).toBeVisible();
  await page.getByRole("search", { name: "Find products" }).getByLabel("Search products, brands and categories").fill("steel bottle");
  await page.getByRole("search", { name: "Find products" }).getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\?search=steel%20bottle/);
});

test("expanded homepage keeps budget browsing and seller onboarding usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Shopping support" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Sell with us" }).getByRole("link", { name: "Apply to become a seller" })).toHaveAttribute("href", "/seller/register");
  const budget = page.getByRole("region", { name: "Shop by budget" });
  await budget.getByRole("link", { name: /Under ₹499/ }).click();
  await expect(page).toHaveURL(/\/shop\?maxPrice=499/);
  await expect(page.getByPlaceholder("Max ₹")).toHaveValue("499");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("owner can save a private name-only product draft", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", isAdmin: true } })));
  let saved = false;
  await page.route("**/api/products", async (route) => {
    if (route.request().method() !== "POST") return route.fulfill({ json: { products: [] } });
    const body = route.request().postData();
    expect(body).toContain("Work in progress");
    expect(body).toMatch(/name="status"\r\n\r\ndraft/);
    saved = true;
    return route.fulfill({ status: 201, json: { name: "Work in progress", status: "draft" } });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "+ Add product" }).click();
  await page.getByLabel("Product name", { exact: true }).fill("Work in progress");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.poll(() => saved).toBe(true);
  await expect(page.getByRole("button", { name: "+ Add product" })).toBeVisible();
});

test("single SKU listing preserves generic details, tax and images through editing", async ({ page }) => {
  const bottle = { ...product, name: "Steel bottle", category: "home-kitchen", productType: "simple", gstMode: "custom", gstRate: 18, hsnCode: "7323", brand: "Example", specifications: "Capacity: 1 litre", weightKg: 0.4, variants: [{ sku: "BOTTLE-1", size: "Standard", color: "", price: 299, stock: 3 }], status: "active" };
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", isAdmin: true } })));
  await page.route(`**/api/products/admin/item/${product._id}`, (route) => route.fulfill({ json: bottle }));
  let updated = false;
  await page.route(`**/api/products/${product._id}`, async (route) => {
    const body = route.request().postData();
    for (const value of ["Updated features", "home-kitchen", "7323", "Example", "custom", "BOTTLE-1"]) expect(body).toContain(value);
    expect(body).toMatch(/name="gstRate"\r\n\r\n18/);
    updated = true;
    return route.fulfill({ json: bottle });
  });
  await page.goto(`/admin/edit/${product._id}`);
  await expect(page.getByLabel("Brand", { exact: true })).toHaveValue("Example");
  await expect(page.getByLabel("GST percentage *")).toHaveValue("18");
  await page.getByLabel("Specifications / key features").fill("Updated features");
  await page.getByRole("button", { name: /4 Review & publish/ }).click();
  await page.getByRole("button", { name: "Save listing", exact: true }).click();
  await expect.poll(() => updated).toBe(true);
});

test("customer adds a single SKU product without selecting a size", async ({ page }) => {
  const bottle = { ...product, name: "Steel bottle", category: "home-kitchen", productType: "simple", brand: "Example", specifications: "Capacity: 1 litre", variants: [{ sku: "BOTTLE-1", size: "Standard", color: "", price: 299, stock: 3 }], sizeStock: [{ size: "Standard", stock: 3 }] };
  await page.route(`**/api/products/${product.slug}`, (route) => route.fulfill({ json: bottle }));
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByRole("heading", { name: "Steel bottle", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Select size/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("guest_cart") || "[]")[0]?.selectedSku)).toBe("BOTTLE-1");
});

test("storefront renders catalogue data without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "One store. More possibilities." })).toBeVisible();
  await expect(page.getByRole("heading", { name: product.name }).first()).toBeVisible();
  await expect(page.locator(`a[href="/product/${product.slug}"]`).first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("public seller applications start with verified email sign-in", async ({ page }) => {
  await page.goto("/seller/register");
  await expect(page.getByRole("heading", { name: "Sell on Tamanna's Hut" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account with email" })).toHaveAttribute("href", "/register?channel=email");
  await page.getByRole("link", { name: "Sign in with an email code" }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("redirectAfterLogin"))).toBe("/seller/register");
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
  await expect(dialog.getByRole("link", { name: "Shop all" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "One store. More possibilities." })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "One store. More possibilities." })).toBeVisible();
  await expect(page.getByText("This page could not be displayed")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("user"))).toBeNull();
});

test("login offers recovery and registration and accepts a safe mocked session", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Password", exact: true }).click();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.getByRole("button", { name: "Password", exact: true }).click();
  await page.getByPlaceholder("Enter your password").fill("safe-password");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "null")?.user?.email)).toBe("test@example.com");
});

test("mobile OTP login completes checkout redirect with a mocked provider", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("redirectAfterLogin", "/my-orders"));
  await page.goto("/login");
  await page.getByRole("button", { name: "Mobile & OTP" }).click();
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByRole("button", { name: "Send login code" }).click();
  await expect(page.getByLabel("One-time code")).toBeVisible();
  await page.getByLabel("One-time code").fill("123456");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/my-orders$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("user") || "null")?.token)).toBe("safe-local-token");
});

test("failed guest bag merge preserves both saved copies", async ({ page }) => {
  const guestItem = { ...product, selectedSize: "0-3M", selectedSku: "TEST-MAR-03", qty: 1 };
  await page.addInitScript((item) => {
    localStorage.setItem("guest_cart", JSON.stringify([item]));
    sessionStorage.setItem("pending_guest_cart", JSON.stringify([item]));
  }, guestItem);
  await page.route("**/api/cart/merge", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Temporarily unavailable" }) }));
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.getByRole("button", { name: "Password", exact: true }).click();
  await page.getByPlaceholder("Enter your password").fill("safe-password");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("guest_cart") || "[]").length)).toBe(1);
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("pending_guest_cart") || "[]").length)).toBe(1);
});

test("return pickup requires a courier assignment and displays the reverse AWB", async ({ page }) => {
  const order = { ...codOrder, status: "Return Approved", returnRequest: { reverseShipmentId: "12345", reverseAwb: "", reversePickupScheduled: false } };
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-admin-token", user: { id: "admin-test", email: "admin@example.com", isAdmin: true } })));
  await page.route("**/api/orders", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([order]) }));
  await page.route("**/api/logistics/orders/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/return/couriers")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ couriers: [{ courier_company_id: 42, courier_name: "Test Reverse Courier", rate: 60 }] }) });
    if (path.endsWith("/return/awb")) order.returnRequest.reverseAwb = "RET123456";
    if (path.endsWith("/return/pickup")) order.returnRequest.reversePickupScheduled = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ order }) });
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/admin/orders");
  await page.getByRole("button", { name: /Test Customer/ }).click();
  await expect(page.getByRole("button", { name: "Schedule reverse pickup" })).toHaveCount(0);
  await page.getByRole("button", { name: "Find return couriers" }).click();
  await page.getByRole("button", { name: /Test Reverse Courier/ }).click();
  await expect(page.getByText("AWB RET123456", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schedule reverse pickup" }).click();
  await expect(page.getByText("Reverse pickup scheduled", { exact: true }).first()).toBeVisible();
});

test("COD refund notification links to a private UPI form and clears on submission", async ({ page }) => {
  const order = { ...codOrder, status: "Refund Pending", paymentStatus: "Paid" };
  let submitted = false;
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user", name: "Test Customer", accountType: "customer" } })));
  await page.route("**/api/orders/my-orders", (route) => route.fulfill({ json: [order] }));
  await page.route("**/api/orders/refund-details/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/notifications")) return route.fulfill({ json: { notifications: submitted ? [] : [{ orderId: order._id, href: `/my-orders#${order._id}`, message: "Provide UPI or bank details for your COD refund" }] } });
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      expect(body.upiId).toBe("test.customer@bank"); submitted = true;
    }
    return route.fulfill({ json: { required: true, submitted, method: "UPI", maskedDestination: "te***@bank" } });
  });
  await page.goto("/");
  const notification = page.getByRole("complementary", { name: "Account notifications" });
  await notification.getByRole("link", { name: /Provide UPI or bank details/ }).click();
  await expect(page).toHaveURL(new RegExp(`/my-orders#${order._id}$`));
  await page.getByLabel("Account holder name").fill("Test Customer");
  await page.getByLabel("UPI ID", { exact: true }).fill("test.customer@bank");
  await page.getByRole("button", { name: "Save refund details" }).click();
  await expect(page.getByRole("heading", { name: "Refund details received" })).toBeVisible();
  await expect(page.getByText("UPI · te***@bank")).toBeVisible();
  await expect(notification).toHaveCount(0);
  await expect(page.getByLabel("UPI ID", { exact: true })).toHaveCount(0);
});

test("bank refund form requires matching confirmation and preserves the email link through login", async ({ page }) => {
  const order = { ...codOrder, status: "Refund Pending", paymentStatus: "Paid" };
  let writes = 0;
  await page.route("**/api/orders/my-orders", (route) => route.fulfill({ json: [order] }));
  await page.route(`**/api/orders/refund-details/${order._id}`, async (route) => {
    if (route.request().method() === "PUT") {
      writes++;
      const body = route.request().postDataJSON(); expect(body.accountNumber).toBe(body.confirmAccountNumber);
      return route.fulfill({ json: { submitted: true, method: "Bank transfer", maskedDestination: "Account ending 7890" } });
    }
    return route.fulfill({ json: { required: true, submitted: false } });
  });
  await page.goto(`/my-orders#${order._id}`);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.getByRole("button", { name: "Password", exact: true }).click();
  await page.getByPlaceholder("Enter your password").fill("safe-password");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(new RegExp(`/my-orders#${order._id}$`));
  await page.getByLabel("Refund method").selectOption("Bank transfer");
  await page.getByLabel("Account holder name").fill("Test Customer");
  await page.getByLabel("Bank account number", { exact: true }).fill("01234567890");
  await page.getByLabel("Confirm bank account number").fill("01234567891");
  await page.getByLabel("IFSC code").fill("ABCD0123456");
  await page.getByRole("button", { name: "Save refund details" }).click();
  await expect(page.getByRole("alert")).toHaveText("Bank account numbers do not match");
  expect(writes).toBe(0);
  await page.getByLabel("Confirm bank account number").fill("01234567890");
  await page.getByRole("button", { name: "Save refund details" }).click();
  await expect(page.getByRole("heading", { name: "Refund details received" })).toBeVisible();
  expect(writes).toBe(1);
});

test("online refund orders never request UPI or bank details", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user" } })));
  await page.route("**/api/orders/my-orders", (route) => route.fulfill({ json: [{ ...codOrder, paymentMethod: "Online", paymentStatus: "Paid", status: "Refund Pending" }] }));
  await page.goto("/my-orders");
  await expect(page.getByText("Refund Pending", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Refund payment details" })).toHaveCount(0);
});

test("registration makes shopping email consent optional", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Join Tamanna's Hut" })).toBeVisible();
  await expect(page.getByLabel("Name (optional)")).toBeVisible();
  await page.getByRole("button", { name: "Email address", exact: true }).click();
  await expect(page.getByRole("main").getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  const consent = page.getByRole("checkbox", { name: /Send me shopping emails/ });
  await expect(consent).toBeVisible();
  await expect(consent).not.toBeChecked();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
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
  await expect(page.getByText("Cash on delivery · Payment pending")).toBeVisible();
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

for (const channel of ['phone', 'email']) {
  test(`${channel}-only signup verifies a code without requiring a password or another contact`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let signup;
    await page.route('**/api/auth/customer-otp/send', async route => { signup=route.request().postDataJSON(); await route.fulfill({json:{challengeToken:'safe-signup-challenge',message:'Code sent'}}); });
    await page.route('**/api/auth/customer-otp/check', async route => {
      expect(route.request().postDataJSON()).toEqual({purpose:'register',challengeToken:'safe-signup-challenge',code:'123456'});
      await route.fulfill({json:{token:'safe-signup-session',user:{id:'signup-test',name:'Customer',passwordLoginEnabled:false,...(channel==='email'?{email:'new@example.com'}:{phone:'+919876543210'})}}});
    });
    await page.goto('/register');
    if(channel==='email') await page.getByRole('button',{name:'Email address',exact:true}).click();
    await page.getByLabel(channel==='phone'?'Mobile number':'Email address',{exact:true}).fill(channel==='phone'?'9876543210':'new@example.com');
    await page.getByRole('checkbox',{name:/I accept/}).check();
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    await expect(page.getByLabel(channel==='phone'?'Email address':'Mobile number',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'Send verification code'}).click();
    expect(signup.channel).toBe(channel);expect(signup.name).toBe('');expect(signup.termsAccepted).toBe(true);expect(signup.password).toBeUndefined();
    await page.getByLabel('One-time code').fill('123456');
    await page.getByRole('button',{name:'Verify & create account'}).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('user'))?.token)).toBe('safe-signup-session');
  });
}
test('email code login supports passwordless customers',async({page})=>{
  await page.route('**/api/auth/customer-otp/send',route=>route.fulfill({json:{challengeToken:'safe-email-challenge',message:'Code sent'}}));
  await page.route('**/api/auth/customer-otp/check',route=>route.fulfill({json:{token:'safe-email-session',user:{id:'test-user',name:'Customer',email:'test@example.com',passwordLoginEnabled:false}}}));
  await page.goto('/login');await page.getByLabel('Email address').fill('test@example.com');await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.getByRole('button',{name:'Send login code'}).click();await page.getByLabel('One-time code').fill('123456');await page.getByRole('button',{name:'Sign in securely'}).click();await expect(page).toHaveURL(/\/$/);
});
test('mobile-only checkout submits COD order without email',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('user',JSON.stringify({token:'safe-mobile-session',user:{id:'mobile-test',name:'Test Parent',phone:'+919876543210',passwordLoginEnabled:false}})));
  await page.route('**/api/cart',route=>route.fulfill({json:{items:[{...product,selectedSize:'0-3M',selectedSku:'TEST-MAR-03',qty:1}]}}));
  await page.route('**/api/auth/profile/mobile-test',route=>route.fulfill({json:{name:'Test Parent',phone:'+919876543210',phoneVerifiedAt:'2026-10-06',address:'12 Sample Street',pincode:'711310',city:'Howrah',state:'West Bengal'}}));
  await page.route('**/api/logistics/postcode/**',route=>route.fulfill({json:{pincode:'711310',city:'Howrah',state:'West Bengal',cod:true}}));
  let submitted;
  await page.route('**/api/orders',async route=>{submitted=route.request().postDataJSON();await route.fulfill({json:{order:{...codOrder,email:''}}});});
  await page.goto('/checkout');await expect(page.getByLabel('Email (optional)',{exact:true})).toBeVisible();await expect(page.getByLabel('Email (optional)',{exact:true})).not.toHaveAttribute('required','');
  await page.getByRole('radio',{name:/Cash on delivery/}).check();await page.getByRole('button',{name:'Place COD order'}).click();await expect(page).toHaveURL(/\/success$/);expect(submitted.customer.email).toBe('');
});
test('mobile-only support can send a message without email',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('user',JSON.stringify({token:'safe-mobile-session',user:{id:'mobile-test',name:'Test Parent',phone:'+919876543210'}})));
  await page.goto('/contact');await page.getByLabel('How can we help?').fill('Please help me with my return request.');await page.getByRole('button',{name:/Send support request/i}).click();await expect(page.getByText('B06F8E07')).toBeVisible();
});

test('passwordless profile verifies deletion by code and preserves account updates without email',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('user',JSON.stringify({token:'safe-mobile-session',user:{id:'mobile-test',name:'Test Parent',phone:'+919876543210',passwordLoginEnabled:false}})));
  await page.route('**/api/auth/profile/mobile-test',route=>route.fulfill({json:{name:'Test Parent',phone:'+919876543210',phoneVerifiedAt:'2026-10-06',passwordLoginEnabled:false}}));
  await page.route('**/api/auth/phone-verification/status',route=>route.fulfill({json:{configured:true,verified:true}}));
  await page.route('**/api/auth/delete-otp/send',route=>route.fulfill({json:{challengeToken:'safe-deletion-challenge',message:'Code sent'}}));
  await page.goto('/profile');await expect(page.getByRole('link',{name:'Password',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Start account deletion'}).click();await expect(page.locator('input[type=password]')).toHaveCount(0);await page.getByRole('button',{name:'Send deletion code'}).click();await expect(page.getByPlaceholder('Account deletion code')).toBeVisible();
});
test('admin can view submitted customer refund details after the refund is recorded',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('user',JSON.stringify({token:'safe-admin-session',user:{id:'admin-test',isAdmin:true,email:'admin@example.com'}})));
  const order={...codOrder,status:'Refunded',paymentStatus:'Refunded',refund:{detailsSubmittedAt:'2026-10-06',amount:299,method:'UPI',reference:'TEST-REFUND'}};
  await page.route('**/api/orders',route=>route.fulfill({json:[order]}));
  await page.route(`**/api/orders/refund-details/${order._id}/admin`,route=>route.fulfill({json:{submitted:true,submittedAt:'2026-10-06',details:{method:'UPI',holderName:'Test Parent',upiId:'test@bank'}}}));
  await page.goto('/admin/orders');await page.getByRole('button',{name:/Test Customer/}).click();await page.getByRole('button',{name:'View customer refund details'}).click();await expect(page.getByText('test@bank',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Retry request email'})).toHaveCount(0);
});


test("existing customer invitation requires matching account sign-in", async ({ page }) => {
  await page.route("**/api/auth/seller-invitations/test-invitation", route => route.fulfill({ json: { email: "test@example.com", existingAccount: true } }));
  await page.goto("/seller/register/test-invitation");
  await expect(page.getByText(/Sign in to the customer account for/)).toBeVisible();
  await page.getByRole("link", { name: "Sign in with an email code" }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("redirectAfterLogin"))).toBe("/seller/register/test-invitation");
});

test("verified customer can submit a public seller application using the existing account", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user", accountType: "customer" } })));
  await page.route("**/api/auth/seller-application/account", route => route.fulfill({ json: { id: "test-user", name: "Test Seller", email: "test@example.com", emailVerified: true, accountType: "customer", passwordLoginEnabled: false } }));
  let submitted;
  await page.route("**/api/auth/seller-applications", async route => { submitted = route.request().postDataJSON(); expect(route.request().headers().authorization).toBe("Bearer safe-local-token"); await route.fulfill({ status: 201, json: { message: "Submitted" } }); });
  await page.goto("/seller/register");
  await expect(page.getByRole("heading", { name: "Apply to become a seller" })).toBeVisible();
  for (const [label, value] of [["Business phone", "9876543210"], ["Seller Centre password", "SellerSecure42"], ["Confirm password", "SellerSecure42"], ["Legal business name", "Example Business"], ["Trade / storefront name", "Example Store"], ["Authorised signatory", "Test Seller"], ["GSTIN", "19ABCDE1234F1Z5"], ["PAN", "ABCDE1234F"], ["Registered address", "123 Example Road"], ["City", "Howrah"], ["State", "West Bengal"], ["Pincode", "711310"], ["Account holder name", "Test Seller"], ["IFSC code", "ABCD0123456"], ["Account number", "1234567890"], ["Confirm account number", "1234567890"]]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("Business constitution", { exact: true }).selectOption("proprietorship");
  await page.getByLabel("Account type", { exact: true }).selectOption("savings");
  await page.getByRole("checkbox", { name: /I checked the GSTIN/ }).check();
  await page.getByRole("checkbox", { name: /The settlement bank account/ }).check();
  await page.getByRole("checkbox", { name: /I accept the seller terms/ }).check();
  await page.getByRole("button", { name: "Submit seller application" }).click();
  await expect(page.getByRole("heading", { name: "Application submitted" })).toBeVisible();
  expect(submitted.termsAccepted).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("user"))).toBeNull();
});

test("password customers confirm their existing password when applying", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user", accountType: "customer" } })));
  await page.route("**/api/auth/seller-application/account", route => route.fulfill({ json: { id: "test-user", name: "Test Seller", email: "test@example.com", emailVerified: true, accountType: "customer", passwordLoginEnabled: true } }));
  await page.goto("/seller/register");
  await expect(page.getByLabel("Existing account password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password", { exact: true })).toHaveCount(0);
});

test("mobile-only customer verifies an email before seeing the business application", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ token: "safe-local-token", user: { id: "test-user", accountType: "customer" } })));
  await page.route("**/api/auth/seller-application/account", route => route.fulfill({ json: { id: "test-user", name: "Test Seller", accountType: "customer", passwordLoginEnabled: false } }));
  await page.route("**/api/auth/seller-application/email/send", route => route.fulfill({ json: { challengeToken: "email-link-test" } }));
  await page.route("**/api/auth/seller-application/email/check", route => route.fulfill({ json: { token: "safe-linked-token", user: { id: "test-user", name: "Test Seller", email: "test@example.com", emailVerified: true, accountType: "customer", passwordLoginEnabled: false } } }));
  await page.goto("/seller/register");
  await page.getByLabel("Email address", { exact: true }).fill("test@example.com");
  await page.getByRole("button", { name: "Send email code" }).click();
  await page.getByLabel("Email verification code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Apply to become a seller" })).toBeVisible();
});

test('refund records require receipt references and saved notes clear safely', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ token: 'safe-admin-session', user: { id: 'admin-test', isAdmin: true, email: 'admin@example.com' } })));
  const order = { ...codOrder, status: 'Refund Pending', paymentStatus: 'Paid', internalNotes: [] };
  let writes = 0;
  await page.route('**/api/orders', route => route.fulfill({ json: [order] }));
  await page.route(`**/api/orders/${order._id}`, async route => {
    writes++;
    order.internalNotes.push({ note: route.request().postDataJSON().internalNote, createdBy: 'admin@example.com' });
    await route.fulfill({ json: order });
  });
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: /Test Customer/ }).click();
  await expect(page.getByText('This button does not send money.', { exact: false })).toBeVisible();
  await page.getByLabel('Paid via').selectOption('UPI');
  await page.getByLabel('Refund transaction ID or UTR').fill('Refunded');
  await page.getByRole('button', { name: 'Record COD refund', exact: true }).click();
  await expect(page.getByText('Enter the actual transaction ID or UTR from your payment receipt')).toBeVisible();
  const note = page.getByPlaceholder('Visible only to staff');
  const save = page.getByRole('button', { name: 'Add note', exact: true });
  await expect(save).toBeDisabled();
  await note.fill('Receipt retained for reconciliation');
  await save.click();
  await expect(note).toHaveValue('');
  await expect(save).toBeDisabled();
  await expect(page.getByText('Receipt retained for reconciliation', { exact: false })).toBeVisible();
  expect(writes).toBe(1);
});


test('admin orders retry failed loads and show collected COD payment accurately', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ token: 'safe-admin-token', user: { id: 'admin-test', isAdmin: true, email: 'admin@example.com' } })));
  let failed = true;
  await page.route('**/api/orders', route => route.fulfill(failed ? { status: 503, json: { message: 'Temporarily unavailable' } } : { json: [{ ...codOrder, status: 'Delivered', paymentStatus: 'Paid' }] }));
  await page.goto('/admin/orders');
  await expect(page.getByRole('alert')).toContainText('We could not load the orders.');
  await expect(page.getByText('No matching orders', { exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Retry orders', exact: true }).click();
  await expect(page.getByText('Cash collected on delivery', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
