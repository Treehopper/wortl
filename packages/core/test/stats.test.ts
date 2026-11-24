import { describe, expect, it } from 'vitest';
import { computeStats, dailySolution, dayNumber, type Game } from '../src/index.js';

const daily = (date: string, state: Game['state'], guesses = 3): Game => ({
  id: `daily-${date}`, mode: 'daily', date, number: dayNumber(date), solution: 'katze',
  guesses: Array(guesses).fill('tasse'), hard: false, state, startedAt: `${date}T08:00:00Z`, finishedAt: `${date}T09:00:00Z`,
});

describe('daily numbers (§7.3)', () => {
  it('counts days from the epoch', () => {
    expect(dayNumber('2026-11-23')).toBe(1);
    expect(dayNumber('2026-11-24')).toBe(2);
    expect(dayNumber('2027-03-29')).toBe(127); // across the DST change
    expect(dayNumber('2020-01-01')).toBe(1);
  });
  it('cycles through the answers', () => {
    expect(dailySolution(['a', 'b', 'c'], 4)).toBe('a');
  });
});

describe('computeStats (§7.4)', () => {
  it('counts consecutive daily wins and breaks on gaps and losses', () => {
    const games = [
      daily('2026-11-23', 'won', 2), daily('2026-11-24', 'won', 3), daily('2026-11-25', 'won', 3),
      daily('2026-11-26', 'lost', 6),
      daily('2026-11-27', 'won', 4), daily('2026-11-29', 'won', 1), daily('2026-11-30', 'won', 2),
    ];
    const s = computeStats(games, '2026-11-30');
    expect(s).toMatchObject({ played: 7, won: 6, maxStreak: 3, currentStreak: 2 });
    expect(s.distribution).toEqual([1, 2, 2, 1, 0, 0]);
  });
  it('keeps the current streak through the next day, then drops it', () => {
    const games = [daily('2026-11-23', 'won'), daily('2026-11-24', 'won')];
    expect(computeStats(games, '2026-11-25').currentStreak).toBe(2);
    expect(computeStats(games, '2026-11-26').currentStreak).toBe(0);
  });
  it('ignores unfinished games', () => {
    expect(computeStats([daily('2026-11-23', 'playing')], '2026-11-23').played).toBe(0);
  });
});
