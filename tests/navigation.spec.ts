import { expect, test } from '@playwright/test';
import { openSidebar, trackConsoleErrors, site } from './helpers';

test('home loads on both URL forms and stays console-error-free', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  for (const url of [site('/'), site('')]) {
    await page.goto(url);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Study for the SAA-C03 anywhere' }),
    ).toBeVisible();
  }
  // Bare (slashless) home URL serves the same page, not a redirect loop.
  await page.goto(site(''));
  expect(page.url()).toMatch(/localhost:4321\/?$/);
  expect(errors).toEqual([]);
});

test('hero click reaches the 01 full guide', async ({ page }) => {
  await page.goto(site('/'));
  await page.getByRole('link', { name: 'Start studying' }).click();
  await expect(page).toHaveURL(/01-aws-fundamentals\/full\//);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Module 01: AWS Fundamentals' }),
  ).toBeVisible();
});

const GROUPS = [
  '01 · AWS Fundamentals',
  '02 · IAM',
  '03 · Compute',
  '04 · Storage',
  '05 · Database',
  '06 · Networking',
  '07 · Security',
  '08 · Application Integration',
  '09 · Monitoring',
  '10 · Migration',
  '11 · Analytics',
  '12 · Architecture Patterns',
  '13 · Cost Optimization',
  '14 · Practice',
];

test('sidebar lists all 14 module groups and each expands to links', async ({ page }) => {
  await page.goto(site('/01-aws-fundamentals/full/'));
  await openSidebar(page);
  const sidebar = page.locator('#starlight__sidebar');
  // Exactly 14 top-level groups — a real DOM count, not the constant below.
  await expect(sidebar.locator('ul.top-level > li > details')).toHaveCount(14);
  for (const group of GROUPS) {
    const details = sidebar.locator('details').filter({ hasText: group });
    await expect(details).toHaveCount(1);
    // Starlight renders collapsed groups as <details> and auto-opens the
    // group holding the current page — only closed groups need a click.
    const isOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open);
    if (!isOpen) await details.locator('summary').click();
    await expect(details.locator('a').first()).toBeVisible();
  }
});

test('Move-to chain: 02 fast-learn links on to 03 fast-learn', async ({ page }) => {
  await page.goto(site('/02-iam/fast-learn/'));
  await page
    .locator('main')
    .getByRole('link', { name: 'Module 03 - Compute' })
    .click();
  await expect(page).toHaveURL(/03-compute\/fast-learn\//);
  await expect(
    page.getByRole('heading', { level: 1 }).first(),
  ).toBeVisible();
});

test('unknown route renders the Starlight 404', async ({ page }) => {
  const response = await page.goto(site('/this-route-does-not-exist/'));
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.getByText('Page not found.')).toBeVisible();
});

test('14-practice ships no diagrams route (404 expected)', async ({ page }) => {
  const response = await page.goto(site('/14-practice/diagrams/'));
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
});
