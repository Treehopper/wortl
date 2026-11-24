import { daysBetween } from './daily.js';
import { MAX_GUESSES, type Game, type LocalDate, type Mode } from './types.js';

export interface Stats {
  mode: Mode;
  played: number;
  won: number;
  winRate: number; // 0..1
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // wins by number of guesses, index 0 = 1 guess
}

/**
 * Statistics are derived from the finished games, never stored (§7.4).
 * Daily streaks count wins on consecutive dates; a missed or lost day breaks them.
 * The current daily streak survives until the end of the day after the last win.
 * Practice streaks count consecutive wins in the order the games finished.
 */
export function computeStats(mode: Mode, games: Game[], today: LocalDate): Stats {
  const finished = games
    .filter((g) => g.mode === mode && g.state !== 'playing')
    .sort((a, b) => (mode === 'daily' ? a.date!.localeCompare(b.date!) : a.finishedAt!.localeCompare(b.finishedAt!)));

  const distribution = Array.from({ length: MAX_GUESSES }, () => 0);
  let won = 0;
  let run = 0;
  let maxStreak = 0;
  let prev: Game | undefined;
  for (const g of finished) {
    const continues = mode === 'practice' || (prev !== undefined && daysBetween(prev.date!, g.date!) === 1);
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
  if (mode === 'daily' && prev && daysBetween(prev.date!, today) > 1) currentStreak = 0;

  return {
    mode,
    played: finished.length,
    won,
    winRate: finished.length ? won / finished.length : 0,
    currentStreak,
    maxStreak,
    distribution,
  };
}
