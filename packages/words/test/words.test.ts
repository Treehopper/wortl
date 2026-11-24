import { describe, expect, it } from 'vitest';
import { createWordList, wordsDe } from '../src/index.js';

describe('words-de pack (§6)', () => {
  const list = createWordList();
  it('has unique five-letter answers in game spelling', () => {
    expect(new Set(wordsDe.answers).size).toBe(wordsDe.answers.length);
    for (const a of wordsDe.answers) expect(a).toMatch(/^[a-zäöü]{5}$/u);
    expect(wordsDe.answers.length).toBeGreaterThan(900);
  });
  it('accepts every answer and common inflected forms', () => {
    for (const a of wordsDe.answers) expect(list.isAllowed(a)).toBe(true);
    for (const w of ['hatte', 'gehst', 'hände', 'bäume', 'fährt']) expect(list.isAllowed(w)).toBe(true);
    expect(list.isAllowed('xxxxx')).toBe(false);
  });
});
