import { expect, test, type Page } from '@playwright/test';
import { dailySolution, dayNumber, evaluate } from '@wortl/core';
import { createWordList } from '@wortl/words';

const words = createWordList();

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const solution = dailySolution(words.answers, dayNumber(today()));
const wrong = ['stein', 'feuer', 'katze'].find((w) => w !== solution)!;

async function type(page: Page, word: string) {
  for (const ch of word) await page.getByRole('button', { name: ch, exact: true }).click();
  await page.getByRole('button', { name: 'Eingabe' }).click();
}

test('plays the daily word: invalid word, guess, resume after reload, win', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('dialog', { name: 'So geht’s' }).getByRole('button', { name: 'Schließen' }).click();

  await type(page, 'qwert');
  await expect(page.getByText('Nicht in der Wortliste')).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Löschen' }).click();

  await type(page, wrong);
  const marks = evaluate(wrong, solution);
  const firstRow = page.getByRole('row').first();
  await expect(firstRow.getByRole('gridcell').first()).toHaveClass(new RegExp(marks[0]!));

  await page.reload();
  await expect(page.getByRole('row').first().getByRole('gridcell').nth(4)).toHaveText(wrong[4]!);
  await expect(page.getByRole('dialog')).toHaveCount(0); // help is shown only once

  await type(page, solution);
  const stats = page.getByRole('dialog', { name: 'Statistik · Tageswort' });
  await expect(stats).toBeVisible({ timeout: 8000 });
  await expect(stats.getByText('Gelöst mit 2 von 6 Versuchen')).toBeVisible();
  await expect(stats.getByRole('button', { name: 'Teilen' })).toBeVisible();
});

test('physical keyboard and practice mode', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'So geht’s' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Übung' }).click();
  await page.keyboard.type('kat');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Zu wenige Buchstaben')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('row').first().getByRole('gridcell').nth(2)).toHaveText('');
});
