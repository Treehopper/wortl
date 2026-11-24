import { DEFAULT_SETTINGS, type Settings } from '../domain/types.js';
import type { Ports } from '../ports/index.js';

const KEY = 'settings';

export class SettingsService {
  constructor(private readonly p: Ports) {}

  async get(): Promise<Settings> {
    const s: Settings & { uiLanguage?: unknown } = { ...DEFAULT_SETTINGS, ...(await this.p.meta.get<Partial<Settings>>(KEY)) };
    delete s.uiLanguage; // stored by versions that offered English
    return s;
  }

  update(patch: Partial<Settings>): Promise<Settings> {
    return this.p.uow.run(async () => {
      const next = { ...(await this.get()), ...patch };
      await this.p.meta.set(KEY, next);
      return next;
    });
  }
}
