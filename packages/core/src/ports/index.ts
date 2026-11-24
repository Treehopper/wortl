import type { Game, GameId, LocalDate, Mode, Timestamp } from '../domain/types.js';

export interface GameRepository {
  get(id: GameId): Promise<Game | undefined>;
  list(mode?: Mode): Promise<Game[]>;
  save(game: Game): Promise<void>;
  clear(): Promise<void>;
}

/** Small keyed values: settings. */
export interface MetaRepository {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
}

/** Runs `fn` atomically: all repository writes inside it commit together or not at all. */
export interface UnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

export interface Clock {
  now(): Timestamp;
  /** The player's local calendar date. */
  today(): LocalDate;
}

export interface Random {
  /** Uniform in [0, 1). */
  next(): number;
}

export interface IdGenerator {
  next(): string;
}

export interface WordList {
  readonly length: number;
  /** Daily solutions, in daily order (§6). */
  readonly answers: readonly string[];
  /** Whether a normalised word may be guessed (answers included). */
  isAllowed(word: string): boolean;
}

export interface Ports {
  games: GameRepository;
  meta: MetaRepository;
  uow: UnitOfWork;
  clock: Clock;
  random: Random;
  ids: IdGenerator;
  words: WordList;
}
