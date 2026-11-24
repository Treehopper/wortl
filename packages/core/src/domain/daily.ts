import type { LocalDate } from './types.js';

/** The day of "Wortl #1". Never change it: it fixes which word belongs to which date (§7.3). */
export const EPOCH: LocalDate = '2026-11-23';

const DAY_MS = 86_400_000;

function utcMidnight(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** Puzzle number of a date: 1 on the epoch, counting up by one per calendar day; at least 1. */
export function dayNumber(date: LocalDate): number {
  return Math.max(1, Math.round((utcMidnight(date) - utcMidnight(EPOCH)) / DAY_MS) + 1);
}

/** Solution for a puzzle number. The answer list is shuffled once at build time (§6). */
export function dailySolution(answers: readonly string[], number: number): string {
  return answers[(number - 1) % answers.length]!;
}

/** Number of calendar days from `a` to `b`. */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((utcMidnight(b) - utcMidnight(a)) / DAY_MS);
}
