import { expect, test } from '@playwright/test';
import { trackConsoleErrors, site } from './helpers';

test('wrong answer shows feedback + explanation, updates tally, survives reload', async ({
  page,
}) => {
  const errors = trackConsoleErrors(page);
  await page.goto(site('/01-aws-fundamentals/quiz/'));

  const tally = page.locator('[data-quiz-tally]');
  await expect(tally).toContainText(/questions — select an answer/);

  const q1 = page.locator('[data-quiz-q]').first();
  const want = (await q1.getAttribute('data-answer'))?.split(',') ?? [];
  expect(want.length).toBeGreaterThan(0);
  const wrong = ['A', 'B', 'C', 'D', 'E'].find((letter) => !want.includes(letter));
  expect(wrong).toBeDefined();

  await q1.locator(`input[value="${wrong}"]`).click();

  const feedback = q1.locator('[data-quiz-feedback]');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(/Not quite/);
  await expect(feedback).toContainText(want[0]);
  await expect(q1.locator('[data-quiz-expl]')).toBeVisible();
  await expect(tally).toContainText(/\(1 answered\)/);

  // Scores persist to localStorage — a reload must restore the tally.
  await page.reload();
  await expect(page.locator('[data-quiz-tally]')).toContainText(/\(1 answered\)/);
  expect(errors).toEqual([]);
});
