import { dailySolution, dayNumber } from '../domain/daily.js';
import { evaluate, hardModeViolation, keyboardMarks, letters, type HardModeViolation } from '../domain/evaluate.js';
import { MAX_GUESSES, type Game, type GameId, type GameState, type Mark } from '../domain/types.js';
import type { Ports } from '../ports/index.js';
import type { SettingsService } from './settings-service.js';

export interface GameView {
  id: GameId;
  number?: number;
  length: number;
  maxGuesses: number;
  rows: { letters: string[]; marks: Mark[] }[];
  keys: Record<string, Mark>;
  state: GameState;
  hard: boolean;
  solution?: string; // only once the game is over
}

export type GuessError =
  | { kind: 'finished' }
  | { kind: 'tooShort' }
  | { kind: 'notInList' }
  | ({ kind: 'hard' } & { violation: HardModeViolation });

export type GuessResult = { ok: true; view: GameView } | { ok: false; error: GuessError; view: GameView };

export function toView(game: Game, length: number): GameView {
  return {
    id: game.id,
    ...(game.number !== undefined && { number: game.number }),
    length,
    maxGuesses: MAX_GUESSES,
    rows: game.guesses.map((g) => ({ letters: letters(g), marks: evaluate(g, game.solution) })),
    keys: keyboardMarks(game.guesses, game.solution),
    state: game.state,
    hard: game.hard,
    ...(game.state !== 'playing' && { solution: game.solution }),
  };
}

export class GameService {
  constructor(
    private readonly p: Ports,
    private readonly settings: SettingsService,
  ) {}

  private view(game: Game): GameView {
    return toView(game, this.p.words.length);
  }

  private async newGame(solution: string, extra: Partial<Game> = {}): Promise<Game> {
    const { hardMode } = await this.settings.get();
    return {
      id: this.p.ids.next(),
      mode: 'daily',
      solution,
      guesses: [],
      hard: hardMode,
      state: 'playing',
      startedAt: this.p.clock.now(),
      ...extra,
    };
  }

  /** Today's game, created on first access and resumed afterwards (A1, A7). */
  daily(): Promise<GameView> {
    return this.p.uow.run(async () => {
      const date = this.p.clock.today();
      const id = `daily-${date}`;
      let game = await this.p.games.get(id);
      if (!game) {
        const number = dayNumber(date);
        game = await this.newGame(dailySolution(this.p.words.answers, number), { id, date, number });
        await this.p.games.save(game);
      }
      return this.view(game);
    });
  }

  get(id: GameId): Promise<GameView | undefined> {
    return this.p.games.get(id).then((g) => g && this.view(g));
  }

  /** Validates and records a guess (A2–A4, A10). The word is normalised first (A6). */
  guess(id: GameId, typed: string): Promise<GuessResult> {
    return this.p.uow.run(async () => {
      const game = await this.p.games.get(id);
      if (!game) throw new Error(`unknown game ${id}`);
      const word = normalise(typed);
      const fail = (error: GuessError): GuessResult => ({ ok: false, error, view: this.view(game) });

      if (game.state !== 'playing') return fail({ kind: 'finished' });
      if (letters(word).length !== this.p.words.length) return fail({ kind: 'tooShort' });
      if (!this.p.words.isAllowed(word)) return fail({ kind: 'notInList' });
      if (game.guesses.length === 0) game.hard = (await this.settings.get()).hardMode;
      if (game.hard) {
        const violation = hardModeViolation(game.guesses, game.solution, word);
        if (violation) return fail({ kind: 'hard', violation });
      }

      game.guesses.push(word);
      if (word === game.solution) game.state = 'won';
      else if (game.guesses.length >= MAX_GUESSES) game.state = 'lost';
      if (game.state !== 'playing') game.finishedAt = this.p.clock.now();
      await this.p.games.save(game);
      return { ok: true, view: this.view(game) };
    });
  }
}

export function normalise(word: string): string {
  return word.trim().toLowerCase().replaceAll('ß', 'ss');
}
