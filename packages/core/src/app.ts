import { computeStats, type Stats } from './domain/stats.js';
import { shareText } from './domain/share.js';
import type { Game, GameId, Mode, Settings, Timestamp } from './domain/types.js';
import type { Ports } from './ports/index.js';
import { GameService, type GameView, type GuessResult } from './services/game-service.js';
import { SettingsService } from './services/settings-service.js';

export interface BackupV1 {
  format: 'wortl-backup';
  version: 1;
  exportedAt: Timestamp;
  games: Game[];
  meta: Record<string, unknown>;
}

export interface WortlApp {
  games: {
    daily(): Promise<GameView>;
    practice(): Promise<GameView>;
    newPractice(): Promise<GameView>;
    get(id: GameId): Promise<GameView | undefined>;
    guess(id: GameId, word: string): Promise<GuessResult>;
    share(id: GameId, url?: string): Promise<string>;
  };
  stats: { get(mode: Mode): Promise<Stats> };
  settings: { get(): Promise<Settings>; update(patch: Partial<Settings>): Promise<Settings> };
  backup: { export(): Promise<BackupV1>; import(data: unknown): Promise<void> };
}

const META_KEYS = ['settings', 'currentPractice'] as const;

export function createApp(p: Ports): WortlApp {
  const settings = new SettingsService(p);
  const games = new GameService(p, settings);

  return {
    games: {
      daily: () => games.daily(),
      practice: () => games.practice(),
      newPractice: () => games.newPractice(),
      get: (id) => games.get(id),
      guess: (id, word) => games.guess(id, word),
      async share(id, url) {
        const game = await p.games.get(id);
        if (!game) throw new Error(`unknown game ${id}`);
        const { highContrast } = await settings.get();
        return shareText(game, { highContrast, ...(url !== undefined && { url }) });
      },
    },
    stats: {
      get: async (mode) => computeStats(mode, await p.games.list(mode), p.clock.today()),
    },
    settings: {
      get: () => settings.get(),
      update: (patch) => settings.update(patch),
    },
    backup: {
      async export() {
        const meta: Record<string, unknown> = {};
        for (const k of META_KEYS) {
          const v = await p.meta.get(k);
          if (v !== undefined) meta[k] = v;
        }
        return { format: 'wortl-backup', version: 1, exportedAt: p.clock.now(), games: await p.games.list(), meta };
      },
      async import(data) {
        const backup = parseBackup(data);
        return p.uow.run(async () => {
          await p.games.clear();
          await p.meta.clear();
          for (const g of backup.games) await p.games.save(g);
          for (const [k, v] of Object.entries(backup.meta)) await p.meta.set(k, v);
        });
      },
    },
  };
}

function parseBackup(data: unknown): BackupV1 {
  const b = data as Partial<BackupV1> | null;
  if (b?.format !== 'wortl-backup' || b.version !== 1 || !Array.isArray(b.games) || typeof b.meta !== 'object') {
    throw new Error('Not a Wördl backup file');
  }
  for (const g of b.games) {
    if (typeof g?.id !== 'string' || typeof g.solution !== 'string' || !Array.isArray(g.guesses)) {
      throw new Error('Not a Wördl backup file');
    }
  }
  return b as BackupV1;
}
