import type { Page } from '@playwright/test';

// Domain-rooted site path (Vercel serves the site at the origin root, no
// `base` subpath). Playwright resolves a leading-slash `goto` against the
// baseURL origin, so paths pass through unchanged.
export const site = (path: string): string => path;

// Collects console errors + uncaught page errors for the
// console-error-free assertions. Attach BEFORE navigation.
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(String(err));
  });
  return errors;
}

// Sidebar lives behind the Menu button on mobile widths and is
// always visible on desktop — open it only when collapsed.
export async function openSidebar(page: Page): Promise<void> {
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) await menu.click();
  await page.locator('#starlight__sidebar').waitFor();
}
