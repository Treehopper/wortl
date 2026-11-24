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
  number?: number; // daily only: "Wortl #12"
  solution: string;
  guesses: string[];
  hard: boolean; // fixed by the first guess (A10)
  state: GameState;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
}

export type UiLanguage = 'de' | 'en';
/** `friendly` is the default light theme; `device`, `light` and `dark` are the paper theme. */
export type Theme = 'friendly' | 'device' | 'light' | 'dark';

export interface Settings {
  uiLanguage: UiLanguage;
  theme: Theme;
  hardMode: boolean;
  highContrast: boolean;
  seenHelp: boolean;
  installHintDismissed: boolean;
  /** Replaces "Wortl" in the header and share text; set via `#title=` in the URL. */
  customTitle?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  uiLanguage: 'de',
  theme: 'friendly',
  hardMode: false,
  highContrast: false,
  seenHelp: false,
  installHintDismissed: false,
};

export const MAX_GUESSES = 6;
