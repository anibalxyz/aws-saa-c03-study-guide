import { expect, test } from '@playwright/test';
import { site } from './helpers';

test('service worker registered with scope and a full precache', async ({ page }) => {
  await page.goto(site('/'));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15_000,
  });

  const scope = await page.evaluate(
    () => navigator.serviceWorker.getRegistration('/').then((r) => r?.scope),
  );
  expect(scope).toBe('http://localhost:4321/');

  const precached = await page.evaluate(async () => {
    const names = await caches.keys();
    let total = 0;
    for (const name of names) total += (await caches.open(name).then((c) => c.keys())).length;
    return total;
  });
  expect(precached).toBeGreaterThanOrEqual(150);
});

test('PWA manifest and favicon serve 200', async ({ request }) => {
  for (const path of ['/manifest.webmanifest', '/favicon.svg']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('offline quiz page loads real content from the precache', async ({ page, context }) => {
  await page.goto(site('/01-aws-fundamentals/quiz/'));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15_000,
  });

  await context.setOffline(true);
  try {
    const response = await page.goto(site('/02-iam/quiz/'));
    expect(response?.status()).toBe(200);
    // Real content, not the browser error page: the quiz H1, tally,
    // and first question all render from the precached shell.
    await expect(
      page.getByRole('heading', { level: 1, name: 'IAM — Quiz' }),
    ).toBeVisible();
    await expect(page.locator('[data-quiz-tally]')).toBeVisible();
    await expect(page.locator('[data-quiz-q]').first()).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
