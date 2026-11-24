import { daysBetween } from './daily.js';
import { MAX_GUESSES, type Game, type LocalDate } from './types.js';

export interface Stats {
  played: number;
  won: number;
  winRate: number; // 0..1
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // wins by number of guesses, index 0 = 1 guess
}

/**
 * Statistics are derived from the finished daily games, never stored (§7.4).
 * Streaks count wins on consecutive dates; a missed or lost day breaks them.
 * The current streak survives until the end of the day after the last win.
 */
export function computeStats(games: Game[], today: LocalDate): Stats {
  const finished = games
    .filter((g) => g.mode === 'daily' && g.state !== 'playing')
    .sort((a, b) => a.date!.localeCompare(b.date!));

  const distribution = Array.from({ length: MAX_GUESSES }, () => 0);
  let won = 0;
  let run = 0;
  let maxStreak = 0;
  let prev: Game | undefined;
  for (const g of finished) {
    const continues = prev !== undefined && daysBetween(prev.date!, g.date!) === 1;
    if (g.state === 'won') {
      won++;
      distribution[g.guesses.length - 1]!++;
      run = continues && prev?.state === 'won' ? run + 1 : 1;
      maxStreak = Math.max(maxStreak, run);
    } else {
      run = 0;
    }
    prev = g;
  }
  let currentStreak = run;
  if (prev && daysBetween(prev.date!, today) > 1) currentStreak = 0;

  return {
    played: finished.length,
    won,
    winRate: finished.length ? won / finished.length : 0,
    currentStreak,
    maxStreak,
    distribution,
  };
}
