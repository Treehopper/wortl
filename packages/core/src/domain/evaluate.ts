import type { Mark } from './types.js';

/** Splits a word into game letters. Umlauts are single letters; the word list has no ß (§6). */
export const letters = (word: string): string[] => [...word];

/**
 * Marks each letter of `guess` against `solution` (§7.1).
 * Pass 1 marks exact hits; pass 2 hands out `present` left to right while unmatched
 * copies of the letter remain, so a letter is never marked more often than it occurs.
 */
export function evaluate(guess: string, solution: string): Mark[] {
  const g = letters(guess);
  const s = letters(solution);
  const marks: Mark[] = g.map(() => 'absent');
  const left = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === s[i]) marks[i] = 'correct';
    else left.set(s[i]!, (left.get(s[i]!) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (marks[i] === 'correct') return;
    const n = left.get(ch) ?? 0;
    if (n > 0) {
      marks[i] = 'present';
      left.set(ch, n - 1);
    }
  });
  return marks;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

/** Best mark per letter over all guesses, for colouring the keyboard. */
export function keyboardMarks(guesses: string[], solution: string): Record<string, Mark> {
  const keys: Record<string, Mark> = {};
  for (const guess of guesses) {
    const marks = evaluate(guess, solution);
    letters(guess).forEach((ch, i) => {
      const m = marks[i]!;
      const prev = keys[ch];
      if (!prev || RANK[m] > RANK[prev]) keys[ch] = m;
    });
  }
  return keys;
}

export type HardModeViolation =
  | { kind: 'position'; letter: string; position: number } // 1-based
  | { kind: 'missing'; letter: string; count: number };

/**
 * Hard mode (A10): every `correct` letter stays in place and every revealed letter is used
 * at least as often as the guesses have shown it to occur.
 */
export function hardModeViolation(guesses: string[], solution: string, next: string): HardModeViolation | undefined {
  const n = letters(next);
  for (const guess of guesses) {
    const g = letters(guess);
    const marks = evaluate(guess, solution);
    for (let i = 0; i < g.length; i++) {
      if (marks[i] === 'correct' && n[i] !== g[i]) return { kind: 'position', letter: g[i]!, position: i + 1 };
    }
    const need = new Map<string, number>();
    g.forEach((ch, i) => {
      if (marks[i] !== 'absent') need.set(ch, (need.get(ch) ?? 0) + 1);
    });
    for (const [ch, count] of need) {
      if (n.filter((c) => c === ch).length < count) return { kind: 'missing', letter: ch, count };
    }
  }
  return undefined;
}
