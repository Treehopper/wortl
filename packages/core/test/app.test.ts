import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, dailySolution, memoryPorts, memoryWordList, type WortlApp } from '../src/index.js';

const ANSWERS = ['katze', 'esels', 'kanal', 'suppe', 'leber', 'baume'];
const words = memoryWordList(ANSWERS, ['tasse', 'essen', 'mappe', 'lager', 'aaaaa']);

let ports: ReturnType<typeof memoryPorts>;
let app: WortlApp;
beforeEach(() => {
  ports = memoryPorts(words, '2026-11-23');
  app = createApp(ports);
});

describe('daily game', () => {
  it('uses the word of the day and resumes after a restart (A1, A7)', async () => {
    const g = await app.games.daily();
    expect(g).toMatchObject({ number: 1, state: 'playing', rows: [] });
    await app.games.guess(g.id, 'tasse');
    const again = await createApp(ports).games.daily();
    expect(again.rows.map((r) => r.letters.join(''))).toEqual(['tasse']);
    expect(again.solution).toBeUndefined();
  });

  it('starts a new game on the next day', async () => {
    const a = await app.games.daily();
    ports.clock.set('2026-11-24');
    const b = await app.games.daily();
    expect(b.id).not.toBe(a.id);
    expect(b.number).toBe(2);
  });

  it('rejects short and unknown words without using a try (A4)', async () => {
    const g = await app.games.daily();
    expect(await app.games.guess(g.id, 'kat')).toMatchObject({ ok: false, error: { kind: 'tooShort' } });
    expect(await app.games.guess(g.id, 'xyzzy')).toMatchObject({ ok: false, error: { kind: 'notInList' } });
    expect((await app.games.daily()).rows).toHaveLength(0);
  });

  it('normalises case and ß (A6)', async () => {
    const g = await app.games.daily();
    expect((await app.games.guess(g.id, 'KATZE')).ok).toBe(true);
  });

  it('wins, reveals the solution and refuses further guesses', async () => {
    const g = await app.games.daily();
    const r = await app.games.guess(g.id, dailySolution(ANSWERS, 1));
    expect(r.view).toMatchObject({ state: 'won', solution: 'katze' });
    expect(await app.games.guess(g.id, 'tasse')).toMatchObject({ ok: false, error: { kind: 'finished' } });
  });

  it('is lost after six wrong guesses (A8)', async () => {
    const g = await app.games.daily();
    for (let i = 0; i < 6; i++) await app.games.guess(g.id, 'tasse');
    expect(await app.games.daily()).toMatchObject({ state: 'lost', solution: 'katze' });
    expect(await app.stats.get()).toMatchObject({ played: 1, won: 0 });
  });
});

describe('hard mode (A10)', () => {
  it('is fixed by the first guess', async () => {
    await app.settings.update({ hardMode: true });
    const g = await app.games.daily();
    await app.games.guess(g.id, 'tasse');
    await app.settings.update({ hardMode: false });
    const r = await app.games.guess(g.id, 'mappe');
    expect(r).toMatchObject({ ok: false, error: { kind: 'hard', violation: { kind: 'missing', letter: 't' } } });
  });
});

describe('share (B2)', () => {
  it('shows circles, not letters', async () => {
    const g = await app.games.daily();
    await app.games.guess(g.id, 'tasse');
    await app.games.guess(g.id, 'katze');
    expect(await app.games.share(g.id)).toBe('Wortl #1 2/6\n\n🟠🟣⚪⚪🟣\n🟣🟣🟣🟣🟣');
    await app.settings.update({ theme: 'dark', customTitle: 'Wördl' });
    expect(await app.games.share(g.id)).toBe('Wördl #1 2/6\n\n🟡🟢⚫⚫🟢\n🟢🟢🟢🟢🟢');
    await app.settings.update({ highContrast: true });
    expect((await app.games.share(g.id)).split('\n')[3]).toBe('🟠🟠🟠🟠🟠');
  });
});

describe('settings', () => {
  it('drops the app language stored by earlier versions', async () => {
    await ports.meta.set('settings', { uiLanguage: 'en', theme: 'dark' });
    const s = await app.settings.get();
    expect(s).not.toHaveProperty('uiLanguage');
    expect(s.theme).toBe('dark');
  });
});

describe('statistics', () => {
  it('ignores practice games from earlier versions', async () => {
    await ports.games.save({
      id: 'p1', mode: 'practice', solution: 'tasse', guesses: ['tasse'], hard: false, state: 'won',
      startedAt: '2026-11-23T08:00:00Z', finishedAt: '2026-11-23T08:01:00Z',
    });
    expect(await app.stats.get()).toMatchObject({ played: 0 });
  });
});

describe('backup (C3)', () => {
  it('round-trips games and settings', async () => {
    await app.settings.update({ theme: 'dark' });
    const g = await app.games.daily();
    await app.games.guess(g.id, 'katze');
    const data = JSON.parse(JSON.stringify(await app.backup.export()));

    const other = createApp(memoryPorts(words, '2026-11-23'));
    await other.backup.import(data);
    expect(await other.settings.get()).toMatchObject({ theme: 'dark' });
    expect(await other.stats.get()).toMatchObject({ played: 1, won: 1 });
  });

  it('rejects other files', async () => {
    await expect(app.backup.import({ foo: 1 })).rejects.toThrow('Not a Wortl backup file');
  });
});
