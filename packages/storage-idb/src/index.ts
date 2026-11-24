import Dexie, { type Table } from 'dexie';
import type { Game, GameRepository, MetaRepository, Mode, UnitOfWork } from '@wortl/core';

interface MetaRow {
  key: string;
  value: unknown;
}

export class WortlDb extends Dexie {
  games!: Table<Game, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'wortl') {
    super(name);
    this.version(1).stores({
      games: 'id, mode',
      meta: 'key',
    });
  }
}

export function idbPorts(db: WortlDb): { games: GameRepository; meta: MetaRepository; uow: UnitOfWork } {
  return {
    games: {
      get: (id) => db.games.get(id),
      list: (mode?: Mode) => (mode ? db.games.where('mode').equals(mode).toArray() : db.games.toArray()),
      save: async (game) => void (await db.games.put(game)),
      clear: () => db.games.clear(),
    },
    meta: {
      get: async <T>(key: string) => (await db.meta.get(key))?.value as T | undefined,
      set: async <T>(key: string, value: T) => void (await db.meta.put({ key, value })),
      clear: () => db.meta.clear(),
    },
    uow: { run: (fn) => db.transaction('rw', db.games, db.meta, fn) },
  };
}
