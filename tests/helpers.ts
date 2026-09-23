import type { Page } from '@playwright/test';

// Origin-rooted site path. Playwright resolves a leading-slash `goto`
// against the baseURL *origin* (dropping its subpath), so every
// navigation spells the /aws-saa-c03-study-guide prefix explicitly
// instead of relying on baseURL resolution.
export const site = (path: string): string => `/aws-saa-c03-study-guide${path}`;

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
