export type Mark = 'correct' | 'present' | 'absent';
/** Only daily games are played; `practice` occurs in games saved by earlier versions and is ignored. */
export type Mode = 'daily' | 'practice';
export type GameId = string;
export type GameState = 'playing' | 'won' | 'lost';

/** Local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;
/** ISO-8601 UTC timestamp. */
export type Timestamp = string;

export interface Game {
  id: GameId; // `daily-<date>`
  mode: Mode;
  date?: LocalDate;
  number?: number; // "Wortl #12"
  solution: string;
  guesses: string[];
  hard: boolean; // fixed by the first guess (A10)
  state: GameState;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
}

/** `friendly` is the default light theme; `device`, `light` and `dark` are the paper theme. */
export type Theme = 'friendly' | 'device' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  hardMode: boolean;
  highContrast: boolean;
  seenHelp: boolean;
  installHintDismissed: boolean;
  /** Replaces "Wortl" throughout the app and in the share text; set via `#title=` in the URL. */
  customTitle?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'friendly',
  hardMode: false,
  highContrast: false,
  seenHelp: false,
  installHintDismissed: false,
};

export const MAX_GUESSES = 6;
