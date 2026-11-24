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
  const stats = page.getByRole('dialog', { name: 'Statistik' });
  await expect(stats).toBeVisible({ timeout: 8000 });
  await expect(stats.getByText('Gelöst mit 2 von 6 Versuchen')).toBeVisible();
  await expect(stats.getByRole('button', { name: 'Teilen' })).toBeVisible();
});

test('physical keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'So geht’s' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.type('kat');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Zu wenige Buchstaben')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('row').first().getByRole('gridcell').nth(2)).toHaveText('');
});

test('a title in the URL renames the game and stays for the home screen', async ({ page }) => {
  await page.goto('/#title=Wörtchen');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wörtchen');
  await expect(page).toHaveTitle('Wörtchen');
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Wörtchen');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#title=W%C3%B6rtchen');

  await page.goto('/'); // without the parameter the stored title comes back, also into the URL
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wörtchen');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#title=W%C3%B6rtchen');
  // Chromium (Android): the manifest stays, so the app remains installable.
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest\.webmanifest$/);

  await page.goto('/#title=');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wortl');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
});

test('a theme in the URL is applied, and a chosen theme goes into the URL', async ({ page }) => {
  await page.goto('/#theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.getByRole('combobox').selectOption('light');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#theme=light');

  await page.goto('/#title=Wörtchen'); // the stored theme joins the title
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#title=W%C3%B6rtchen&theme=light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto('/#theme=friendly'); // the default stays out of the URL
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#title=W%C3%B6rtchen');
});
