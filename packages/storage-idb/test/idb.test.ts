import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { counterIds, createApp, FixedClock, memoryWordList, seededRandom } from '@wortl/core';
import { idbPorts, WortlDb } from '../src/index.js';

describe('IndexedDB adapter', () => {
  it('persists games and rolls back a failed unit of work', async () => {
    const db = new WortlDb('test-' + Math.random());
    const ports = idbPorts(db);
    const app = createApp({ ...ports, clock: new FixedClock('2026-11-23'), random: seededRandom(1), ids: counterIds(),
      words: memoryWordList(['katze'], ['tasse']) });
    const g = await app.games.daily();
    await app.games.guess(g.id, 'tasse');
    expect((await app.games.daily()).rows).toHaveLength(1);

    await expect(ports.uow.run(async () => {
      await ports.meta.set('x', 1);
      throw new Error('boom');
    })).rejects.toThrow('boom');
    expect(await ports.meta.get('x')).toBeUndefined();
  });
});
