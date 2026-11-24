import { evaluate } from './evaluate.js';
import { MAX_GUESSES, type Game, type Mark } from './types.js';

const EMOJI: Record<'normal' | 'highContrast', Record<Mark, string>> = {
  normal: { correct: '🟢', present: '🟡', absent: '⚫' },
  highContrast: { correct: '🟠', present: '🔵', absent: '⚫' },
};

/** Spoiler-free result text (B2): title line plus one row of circles per guess. */
export function shareText(game: Game, opts: { highContrast: boolean; url?: string }): string {
  const emoji = EMOJI[opts.highContrast ? 'highContrast' : 'normal'];
  const score = game.state === 'won' ? String(game.guesses.length) : 'X';
  const title = game.mode === 'daily' ? `Wördl #${game.number}` : 'Wördl (Übung)';
  const rows = game.guesses.map((g) => evaluate(g, game.solution).map((m) => emoji[m]).join(''));
  return [`${title} ${score}/${MAX_GUESSES}${game.hard ? '*' : ''}`, '', ...rows, ...(opts.url ? ['', opts.url] : [])].join('\n');
}
