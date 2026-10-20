import { test, expect } from "@playwright/test";

async function homepage(page, totals) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ json: path.endsWith("/store-stats") ? totals : path.endsWith("/products") ? { products: [] } : {} });
  });
  await page.goto("/");
}

test("verified homepage totals fit a narrow mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await homepage(page, { deliveredOrders: 23, customersServed: 19, registeredCustomers: 42, activeBags: 3 });
  const strip = page.getByRole("region", { name: "Our delivered orders" });
  await expect(strip).toContainText("23 orders delivered");
  await expect(strip).toContainText("42 registered customers");
  await expect(strip).toContainText("3 active shopping bags");
  await expect(strip.getByText("Website orders delivered and paid", { exact: false })).toBeHidden();
  await strip.getByText("About these numbers", { exact: true }).click();
  await expect(strip.getByText("Website orders delivered and paid", { exact: false })).toBeVisible();
  expect(await strip.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("zero and invalid totals stay hidden", async ({ page }) => {
  await homepage(page, { deliveredOrders: 0, customersServed: 0 });
  await expect(page.getByRole("heading", { name: "Shop by department" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Our delivered orders" })).toHaveCount(0);
});
