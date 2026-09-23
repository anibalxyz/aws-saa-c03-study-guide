import { expect, test } from '@playwright/test';
import { site } from './helpers';

test('scrolling to the bottom completes the page: badge 1/74 + stored key', async ({
  page,
}) => {
  await page.goto(site('/01-aws-fundamentals/full/'));

  const badge = page.locator('[data-progress-badge]');
  await expect(badge).toContainText('0/74');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(badge).toContainText('1/74');

  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('saa-progress-v1')),
  );
  expect(keys).toContain('saa-progress-v101-aws-fundamentals/full');
});
