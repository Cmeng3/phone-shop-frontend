import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const password = 'Workspace-Test-Password-2026!';
async function login(page, email = 'admin@workspace.test') {
  await page.goto('/');
  await page.getByLabel('Username, email or phone number').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible();
  await expect(page.getByText('Live from your workspace')).toBeVisible();
}
const nav = (page, name) =>
  page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name, exact: true });
async function open(page, name) {
  await nav(page, name).click();
}

test('backend redirects signed-out page requests and protects direct links after logout', async ({
  page,
}) => {
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Good to have you back.' })).toBeVisible();
  await login(page, 'alex.morgan');
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Your product catalog' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login$/);
});

test('login validation, real dashboard, profile and session persistence', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mkdirSync('../docs/screenshots', { recursive: true });
  await page.goto('/');
  await page.getByRole('heading', { name: 'Good to have you back.' }).waitFor();
  await page.screenshot({ path: '../docs/screenshots/login.png', fullPage: true });
  await page.getByLabel('Username, email or phone number').fill('admin@workspace.test');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page.getByText('Live from your workspace')).toBeVisible();
  await page.screenshot({ path: '../docs/screenshots/dashboard.png', fullPage: true });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export overview' }).click();
  expect((await download).suggestedFilename()).toBe('phoneshop-overview.csv');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible();
  await page.getByRole('link', { name: 'Open my profile' }).click();
  await page.getByLabel('Phone number').fill('+85511223344');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Your profile is up to date.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Phone number')).toHaveValue('+85511223344');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good to have you back.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('admin creates a complete catalog and confirms destructive actions', async ({ page }) => {
  await login(page);
  await open(page, 'Categories');
  await page.getByRole('button', { name: 'Add category', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Category name').fill('Test Wearables');
  await dialog.getByLabel('Shop', { exact: true }).selectOption({ label: 'Central Phone Store' });
  await dialog.getByRole('button', { name: 'Add category', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Brands');
  await page.getByRole('button', { name: 'Add brand', exact: true }).first().click();
  await dialog.getByLabel('Brand name').fill('Test Watch Co');
  await dialog.getByLabel('Shop', { exact: true }).selectOption({ label: 'Central Phone Store' });
  await dialog.getByRole('button', { name: 'Add brand', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Product lines');
  await page.getByRole('button', { name: 'Add product line', exact: true }).first().click();
  await dialog.getByLabel('Product line name').fill('Test Watch Series');
  await dialog
    .getByLabel('Category', { exact: true })
    .selectOption({ label: 'Test Wearables · Central Phone Store' });
  await dialog
    .getByLabel('Brand', { exact: true })
    .selectOption({ label: 'Test Watch Co · Central Phone Store' });
  await dialog.getByRole('button', { name: 'Add product line', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Products');
  await page.getByRole('button', { name: 'Add product', exact: true }).first().click();
  await dialog.getByLabel('Product name').fill('Test Watch');
  await dialog.getByLabel('SKU').fill('TEST-WATCH-001');
  await dialog.getByLabel('Shop', { exact: true }).selectOption({ label: 'Central Phone Store' });
  await dialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Test Wearables' });
  await dialog.getByLabel('Brand', { exact: true }).selectOption({ label: 'Test Watch Co' });
  await dialog
    .getByLabel('Product line', { exact: true })
    .selectOption({ label: 'Test Watch Series' });
  await dialog.getByLabel('Listed price').fill('125.50');
  await dialog.getByLabel('Stock quantity').fill('3');
  await dialog.getByLabel('Product image', { exact: true }).setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('invalid image'),
  });
  await dialog.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Upload a valid image');
  await dialog.getByLabel('Product image', { exact: true }).setInputFiles({
    name: 'watch.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGOUbMlmwAaYsIoOWgkA0uYBGCG2VBkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(dialog.getByRole('img', { name: 'Image preview' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('TEST-WATCH-001');
  await expect(page.getByRole('row').filter({ hasText: 'TEST-WATCH-001' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit Test Watch', exact: true }).click();
  await expect(dialog.getByRole('img', { name: 'Image preview' })).toBeVisible();
  await dialog.getByLabel('Stock quantity').fill('8');
  await dialog.getByLabel('Remove current image').check();
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'TEST-WATCH-001' })).toContainText(
    '8 units',
  );
  await page.getByRole('button', { name: 'Delete Test Watch', exact: true }).click();
  await dialog.getByLabel('Confirm your admin password').fill('wrong-password');
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel('Confirm your admin password').fill(password);
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'No matches this time' })).toBeVisible();
});

test('owner shop isolation and mobile navigation', async ({ page }) => {
  await login(page, 'owner@workspace.test');
  await expect(nav(page, 'Team members')).toHaveCount(0);
  await open(page, 'Products');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Riverside exclusive', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add product', exact: true }).first().click();
  await expect(page.getByRole('dialog').getByLabel('Shop', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.screenshot({ path: '../docs/screenshots/products.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await nav(page, 'Overview').click();
  await expect(page.getByText('Live from your workspace')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: '../docs/screenshots/mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await nav(page, 'Products').click();
  await expect(page.getByRole('combobox', { name: 'Sort products' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: '../docs/screenshots/mobile-products.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('admin manages roles, users, bans and request approval', async ({ page }) => {
  await login(page);
  await open(page, 'Shops & tenants');
  await page.getByRole('button', { name: 'Add shop', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Shop name').fill('Test Branch');
  await dialog.getByRole('button', { name: 'Add shop', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Roles & permissions');
  await page.getByRole('button', { name: 'Add role', exact: true }).first().click();
  await dialog.getByLabel('Role name').fill('Test Manager');
  await dialog.getByLabel('Manage shop catalog').check();
  await dialog.getByRole('button', { name: 'Add role', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Team members');
  await page.getByRole('button', { name: 'Add team member', exact: true }).first().click();
  await dialog.getByLabel('Username', { exact: true }).fill('test.teammate');
  await dialog.getByLabel('Email address').fill('teammate@workspace.test');
  await dialog.getByLabel('Temporary password').fill(password);
  await dialog.getByLabel('Shop', { exact: true }).selectOption({ label: 'Test Branch' });
  await dialog.getByLabel('Role', { exact: true }).selectOption({ label: 'Test Manager' });
  await dialog.getByRole('button', { name: 'Add team member', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Ban test.teammate', exact: true }).click();
  await dialog.getByLabel('Confirm your admin password').fill(password);
  await dialog.getByRole('button', { name: 'Ban', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'teammate@workspace.test' })).toContainText(
    'banned',
  );
  await page.getByRole('button', { name: 'Unban test.teammate', exact: true }).click();
  await dialog.getByRole('button', { name: 'Unban', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await open(page, 'Role requests');
  await page.getByRole('button', { name: 'Approve request 1', exact: true }).click();
  await dialog.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'sam.chen' })).toContainText('approved');
});

test('catalog sorting, shop filters, export and reload use the real API', async ({ page }) => {
  await login(page);
  await open(page, 'Products');
  await page
    .getByRole('combobox', { name: 'Filter by shop' })
    .selectOption({ label: 'Central Phone Store' });
  await page.getByRole('combobox', { name: 'Sort products' }).selectOption('stock,id');
  await page.getByRole('button', { name: 'Low stock', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
  await expect(page.locator('tbody tr').first()).toContainText('Galaxy Tab S10');
  await expect(page.locator('tbody tr').nth(1)).toContainText('Pixel 9 Pro');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export products' }).click();
  const download = await downloadEvent;
  const csv = readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('Galaxy Tab S10');
  expect(csv).toContain('Pixel 9 Pro');
  expect(csv).not.toContain('Riverside exclusive');
  expect(csv.trim().split('\r\n')).toHaveLength(3);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Sort products' })).toHaveValue('stock,id');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(11);
  await page
    .getByRole('combobox', { name: 'Filter by category' })
    .selectOption({ label: 'Smartphones · Central Phone Store' });
  await page
    .getByRole('combobox', { name: 'Filter by shop' })
    .selectOption({ label: 'Riverside Mobile' });
  await expect(page.getByRole('combobox', { name: 'Filter by category' })).toHaveValue('');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  await expect(page.locator('tbody')).toContainText('Riverside exclusive');
});

test('catalog recovers from a connection failure without losing the session', async ({ page }) => {
  await login(page);
  await page.route('**/api/v1/products*', (route) => route.abort());
  await open(page, 'Products');
  await expect(page.getByRole('alert')).toContainText('Check your connection');
  await page.unroute('**/api/v1/products*');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('owner submits request and changes password with session revocation', async ({ page }) => {
  await login(page, 'owner@workspace.test');
  await open(page, 'Role requests');
  await page.getByRole('button', { name: 'Request a role', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Requested role').selectOption({ label: 'Member' });
  await dialog.getByLabel('Reason for this request').fill('Browser test request');
  await dialog.getByRole('button', { name: 'Submit request' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Browser test request' })).toContainText(
    'pending',
  );
  await page.getByRole('link', { name: 'Open my profile' }).click();
  await page.getByRole('tab', { name: 'Password & security' }).click();
  await page.getByLabel('Current password', { exact: true }).fill(password);
  await page.getByLabel('New password', { exact: true }).fill('Changed-Workspace-Password-2026!');
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill('Changed-Workspace-Password-2026!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('heading', { name: 'Good to have you back.' })).toBeVisible();
  await page.getByLabel('Username, email or phone number').fill('owner@workspace.test');
  await page.getByLabel('Password', { exact: true }).fill('Changed-Workspace-Password-2026!');
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page.getByText('Live from your workspace')).toBeVisible();
});
