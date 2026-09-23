import { expect, test } from '@playwright/test';
import { site } from './helpers';

test('diagrams render to SVG and open in a closable fullscreen modal', async ({
  page,
}) => {
  await page.goto(site('/01-aws-fundamentals/diagrams/'));
  await expect(page.locator('h1')).toHaveCount(1);

  // Mermaid renders lazily on scroll — the first block is near the top,
  // so it resolves shortly after load.
  const firstSvg = page.locator('.mermaid-figure svg').first();
  await expect(firstSvg).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Open fullscreen' }).first().click();
  const modal = page.locator('[data-mermaid-modal]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('svg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toBeHidden();
});

test('site search returns results for "S3 bucket"', async ({ page }) => {
  await page.goto(site('/'));
  await page.getByRole('button', { name: 'Search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await dialog.getByRole('textbox', { name: 'Search' }).fill('S3 bucket');
  await expect(dialog.getByText(/results for S3 bucket/)).toBeVisible();
  const results = dialog.getByRole('link');
  await expect(results.first()).toBeVisible();
  expect(await results.count()).toBeGreaterThan(0);
});
