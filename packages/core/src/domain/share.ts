import { evaluate } from './evaluate.js';
import { MAX_GUESSES, type Game, type Mark } from './types.js';

export type SharePalette = 'friendly' | 'paper' | 'highContrast';

const EMOJI: Record<SharePalette, Record<Mark, string>> = {
  friendly: { correct: '🟣', present: '🟠', absent: '⚪' },
  paper: { correct: '🟢', present: '🟡', absent: '⚫' },
  highContrast: { correct: '🟠', present: '🔵', absent: '⚫' },
};

/** Spoiler-free result text (B2): title line plus one row of circles per guess. */
export function shareText(game: Game, opts: { palette: SharePalette; title?: string; url?: string }): string {
  const emoji = EMOJI[opts.palette];
  const name = opts.title || 'Wortl';
  const score = game.state === 'won' ? String(game.guesses.length) : 'X';
  const rows = game.guesses.map((g) => evaluate(g, game.solution).map((m) => emoji[m]).join(''));
  return [`${name} #${game.number} ${score}/${MAX_GUESSES}${game.hard ? '*' : ''}`, '', ...rows, ...(opts.url ? ['', opts.url] : [])].join('\n');
}
