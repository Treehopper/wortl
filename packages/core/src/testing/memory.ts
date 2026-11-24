// In-memory port implementations for tests and tools. Not used by the app.
import type { Game, LocalDate, Timestamp } from '../domain/types.js';
import type { Clock, GameRepository, IdGenerator, MetaRepository, Ports, Random, UnitOfWork, WordList } from '../ports/index.js';

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export class MemoryGames implements GameRepository {
  readonly rows = new Map<string, Game>();
  async get(id: string) { const g = this.rows.get(id); return g && clone(g); }
  async list(mode?: Game['mode']) { return [...this.rows.values()].filter((g) => !mode || g.mode === mode).map(clone); }
  async save(game: Game) { this.rows.set(game.id, clone(game)); }
  async clear() { this.rows.clear(); }
}

export class MemoryMeta implements MetaRepository {
  readonly rows = new Map<string, unknown>();
  async get<T>(key: string) { return clone(this.rows.get(key)) as T | undefined; }
  async set<T>(key: string, value: T) { this.rows.set(key, clone(value)); }
  async clear() { this.rows.clear(); }
}

export const directUnitOfWork: UnitOfWork = { run: (fn) => fn() };

export class FixedClock implements Clock {
  constructor(public date: LocalDate, public time: Timestamp = `${date}T12:00:00.000Z`) {}
  now() { return this.time; }
  today() { return this.date; }
  set(date: LocalDate) { this.date = date; this.time = `${date}T12:00:00.000Z`; }
}

/** Deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): Random {
  let s = seed;
  return {
    next() {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function counterIds(prefix = 'id'): IdGenerator {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

export function memoryWordList(answers: string[], extra: string[] = []): WordList {
  const allowed = new Set([...answers, ...extra]);
  return { length: 5, answers, isAllowed: (w) => allowed.has(w) };
}

export function memoryPorts(words: WordList, today: LocalDate = '2026-11-23'): Ports & { clock: FixedClock; games: MemoryGames; meta: MemoryMeta } {
  return {
    games: new MemoryGames(),
    meta: new MemoryMeta(),
    uow: directUnitOfWork,
    clock: new FixedClock(today),
    random: seededRandom(1),
    ids: counterIds(),
    words,
  };
}
