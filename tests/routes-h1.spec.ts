import { expect, test } from '@playwright/test';
import { trackConsoleErrors, site } from './helpers';

// Regression for the duplicate-H1 fix (Job 1): every synced page must
// render exactly one h1 — the Starlight frontmatter title, with no
// repeated source `# H1` below it.
const MODULE_01_ROUTES = [
  '/01-aws-fundamentals/full/',
  '/01-aws-fundamentals/ultra-fast/',
  '/01-aws-fundamentals/fast-learn/',
  '/01-aws-fundamentals/diagrams/',
  '/01-aws-fundamentals/quiz/',
] as const;

for (const route of MODULE_01_ROUTES) {
  test(`module 01 ${route} loads with exactly one h1`, async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(site(route));
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
