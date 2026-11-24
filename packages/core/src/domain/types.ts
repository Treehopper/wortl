export type Mark = 'correct' | 'present' | 'absent';
export type Mode = 'daily' | 'practice';
export type GameId = string;
export type GameState = 'playing' | 'won' | 'lost';

/** Local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;
/** ISO-8601 UTC timestamp. */
export type Timestamp = string;

export interface Game {
  id: GameId; // daily: `daily-<date>`; practice: generated
  mode: Mode;
  date?: LocalDate; // daily only
  number?: number; // daily only: "Wördl #12"
  solution: string;
  guesses: string[];
  hard: boolean; // fixed by the first guess (A10)
  state: GameState;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
}

export type UiLanguage = 'device' | 'en' | 'de';
export type Theme = 'device' | 'light' | 'dark';

export interface Settings {
  uiLanguage: UiLanguage;
  theme: Theme;
  hardMode: boolean;
  highContrast: boolean;
  seenHelp: boolean;
  installHintDismissed: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  uiLanguage: 'device',
  theme: 'device',
  hardMode: false,
  highContrast: false,
  seenHelp: false,
  installHintDismissed: false,
};

export const MAX_GUESSES = 6;
