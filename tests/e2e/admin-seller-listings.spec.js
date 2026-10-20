import { test, expect } from '@playwright/test';

const sellerId = '222222222222222222222222';
const productId = '333333333333333333333333';
test('administrator can assign a prepared draft to its actual seller without seller credentials', async ({ page }) => {
  let assigned = false;
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ token: 'test-admin', user: { id: 'admin-test', accountType: 'platform_admin', isAdmin: true } })));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; let body = {};
    if (path.endsWith('/seller-choices')) body = { sellers: [{ id: sellerId, name: 'Kismat Collection', deliveryStates: ['West Bengal'] }] };
    else if (path.endsWith(`/admin/${productId}/seller`)) {
      const request = route.request().postDataJSON(); expect(request.sellerId).toBe(sellerId); expect(request.reason).toContain('Correct'); assigned = true;
      body = { message: 'Draft assigned to Kismat Collection. Administrator approval is required before it goes live.', product: { sellerId } };
    } else if (path.endsWith(`/admin/item/${productId}`)) body = { _id: productId, sellerId: '111111111111111111111111', name: 'Prepared Kismat draft', price: 499, status: 'draft', category: 'boys', images: [], variants: [] };
    await route.fulfill({ json: body });
  });
  await page.goto(`/admin/edit/${productId}`);
  await page.getByLabel('Assign draft to seller', { exact: true }).selectOption(sellerId);
  await expect(page.getByText(/existing delivery restriction remains: West Bengal/)).toBeVisible();
  await page.getByLabel('Reason for seller assignment', { exact: true }).fill('Correct owner of the prepared admin draft');
  await page.getByRole('button', { name: 'Assign draft and record audit', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Draft assigned to Kismat Collection');
  expect(assigned).toBe(true);
  await expect(page.getByText('Kismat Collection', { exact: true }).first()).toBeVisible();
});

test('admin create form includes seller selection', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ token: 'test-admin', user: { id: 'admin-test', accountType: 'platform_admin', isAdmin: true } })));
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().endsWith('/seller-choices') ? { sellers: [{ id: sellerId, name: 'Kismat Collection' }] } : { products: [], currentPage: 1, totalPages: 1, totalProducts: 0 } }));
  await page.goto('/admin'); await page.getByRole('button', { name: '+ Add product', exact: true }).click();
  await page.getByLabel('Seller / storefront', { exact: true }).selectOption(sellerId);
  await expect(page.getByText('This listing will belong to Kismat Collection and use the existing administrator approval flow.')).toBeVisible();
});
