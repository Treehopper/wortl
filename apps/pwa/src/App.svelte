<script lang="ts">
  import type { GameView, GuessError, Mark, Settings, Stats } from '@wortl/core';
  import { onMount } from 'svelte';
  import { app, isIos, isStandalone } from './lib/app.js';
  import Board from './lib/components/Board.svelte';
  import HelpSheet from './lib/components/HelpSheet.svelte';
  import InstallHint from './lib/components/InstallHint.svelte';
  import Keyboard from './lib/components/Keyboard.svelte';
  import SettingsSheet from './lib/components/SettingsSheet.svelte';
  import StatsSheet from './lib/components/StatsSheet.svelte';
  import { confetti } from './lib/confetti.js';
  import { msg, setTitle, t } from './lib/i18n/index.js';
  import { applyUrlSettings, DEFAULT_TITLE, settingsFromUrl } from './lib/url-settings.js';

  const TILE_DELAY = 260;
  const FLIP = 520;
  const REVEAL_MS = TILE_DELAY * 4 + FLIP;
  const WIN_TEXTS = [msg('Unbelievable!'), msg('Brilliant!'), msg('Excellent!'), msg('Well done!'), msg('Good job!'), msg('Just made it!')];

  type SheetName = 'help' | 'stats' | 'settings' | null;
  interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
  }

  let settings = $state<Settings>();
  let view = $state<GameView>();
  let current = $state<string[]>([]);
  let keys = $state<Record<string, Mark>>({}); // lags behind view.keys until the reveal ends
  let revealRow = $state(-1);
  let bounceRow = $state(-1);
  let shake = $state(false);
  let busy = $state(false);
  let toast = $state<{ text: string; id: number } | null>(null);
  let sheet = $state<SheetName>(null);
  let stats = $state<Stats>();
  let title = $state(DEFAULT_TITLE);
  let installPrompt = $state<InstallPromptEvent | null>(null);

  const showInstallHint = $derived(
    settings !== undefined && !settings.installHintDismissed && !isStandalone() && (isIos() || installPrompt !== null),
  );

  function applySettings(s: Settings) {
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    if (s.highContrast) root.dataset.contrast = 'high';
    else delete root.dataset.contrast;
    title = s.customTitle || DEFAULT_TITLE;
    setTitle(title);
    applyUrlSettings(s, isIos());
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  }

  /** Undocumented: `#title=…` and `#theme=…` in the URL (lib/url-settings.ts); `#title=` restores "Wortl". */
  async function applySettingsFromUrl() {
    const fromUrl = settingsFromUrl();
    if (Object.entries(fromUrl).some(([k, v]) => v !== (settings?.[k as keyof Settings] ?? ''))) {
      settings = await app.settings.update(fromUrl);
      applySettings(settings);
    }
  }

  function show(v: GameView) {
    view = v;
    current = [];
    keys = v.keys;
    revealRow = -1;
    bounceRow = -1;
  }

  function say(text: string, ms = 1800) {
    const id = Date.now();
    toast = { text, id };
    setTimeout(() => toast?.id === id && (toast = null), ms);
  }

  function errorText(e: GuessError): string {
    switch (e.kind) {
      case 'tooShort': return t('Not enough letters');
      case 'notInList': return t('Not in the word list');
      case 'finished': return '';
      case 'hard': {
        const v = e.violation;
        const letter = v.letter.toUpperCase();
        if (v.kind === 'position') return t('Letter {n} must be {letter}', { n: v.position, letter });
        return v.count > 1 ? t('Guess must contain {letter} {n} times', { letter, n: v.count }) : t('Guess must contain {letter}', { letter });
      }
    }
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function submit() {
    if (!view) return;
    const res = await app.games.guess(view.id, current.join(''));
    if (!res.ok) {
      const text = errorText(res.error);
      if (text) say(text);
      shake = true;
      setTimeout(() => (shake = false), 420);
      navigator.vibrate?.(60);
      return;
    }
    busy = true;
    view = res.view;
    current = [];
    revealRow = res.view.rows.length - 1;
    await wait(REVEAL_MS);
    keys = res.view.keys;
    busy = false;
    if (res.view.state === 'playing') return;

    if (res.view.state === 'won') {
      bounceRow = revealRow;
      say(t(WIN_TEXTS[res.view.rows.length - 1]!));
      const css = getComputedStyle(document.documentElement);
      confetti(['--correct', '--present', '--text'].map((v) => css.getPropertyValue(v).trim()));
    } else {
      say(res.view.solution!.toUpperCase(), 3000);
    }
    await wait(1800);
    await openStats();
  }

  // Not `sheet`: after Escape the dialog is closed a moment before its close event clears `sheet`.
  const dialogOpen = () => document.querySelector('dialog[open]') !== null;

  function onkey(key: string) {
    if (busy || dialogOpen() || !view || view.state !== 'playing') return;
    if (key === 'enter') void submit();
    else if (key === 'back') current = current.slice(0, -1);
    else if (current.length < view.length) current = [...current, key];
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || dialogOpen()) return;
    const k = e.key.toLowerCase();
    if (k === 'enter') onkey('enter');
    else if (k === 'backspace') onkey('back');
    else if (k === 'ß') ['s', 's'].forEach(onkey);
    else if (/^[a-zäöü]$/.test(k)) onkey(k);
    else return;
    e.preventDefault();
  }

  async function openStats() {
    stats = await app.stats.get();
    sheet = 'stats';
  }

  async function share() {
    if (!view) return;
    const text = await app.games.share(view.id, location.origin + location.pathname);
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      say(t('Copied to clipboard'));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say(t('Sharing failed'));
    }
  }

  async function updateSettings(patch: Partial<Settings>) {
    settings = await app.settings.update(patch);
    applySettings(settings);
  }

  async function exportBackup() {
    const data = JSON.stringify(await app.backup.export(), null, 1);
    const name = `${title.replace(/[^\p{L}\p{N}]+/gu, '-')}-Sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([data], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importBackup(file: File) {
    if (!confirm(t('Replace all games and statistics on this device with the backup?'))) return;
    try {
      await app.backup.import(JSON.parse(await file.text()));
      settings = await app.settings.get();
      applySettings(settings);
      show(await app.games.daily());
      sheet = null;
      say(t('Backup restored'));
    } catch {
      say(t('This is not a {title} backup file'), 3000);
    }
  }

  async function onVisible() {
    if (document.visibilityState !== 'visible' || busy || !view) return;
    const today = await app.games.daily();
    if (today.id !== view.id) show(today); // the date changed while the app was in the background
  }

  onMount(() => {
    void (async () => {
      settings = await app.settings.get();
      await applySettingsFromUrl(); // before applySettings writes the stored ones into the URL
      applySettings(settings);
      show(await app.games.daily());
      if (!settings.seenHelp) {
        sheet = 'help';
        settings = await app.settings.update({ seenHelp: true });
      }
    })();
    void navigator.storage?.persist?.();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      installPrompt = e as InstallPromptEvent;
    };
    addEventListener('beforeinstallprompt', onPrompt);
    document.addEventListener('visibilitychange', onVisible);
    const onHash = () => void applySettingsFromUrl();
    addEventListener('hashchange', onHash);
    return () => {
      removeEventListener('hashchange', onHash);
      removeEventListener('beforeinstallprompt', onPrompt);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#key title}
  <div class="app">
    <header class="top">
      <button type="button" class="icon" onclick={() => (sheet = 'help')} aria-label={t('How to play')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
      </button>
      <h1 style:font-size={title.length > 9 ? '1.35rem' : null}>{title}</h1>
      <div class="right">
        <button type="button" class="icon" onclick={openStats} aria-label={t('Statistics')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>
        </button>
        <button type="button" class="icon" onclick={() => (sheet = 'settings')} aria-label={t('Settings')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>
      </div>
    </header>

    {#if view?.number}
      <p class="number">{t('Daily word')} #{view.number}</p>
    {/if}

    {#if showInstallHint}
      <InstallHint
        ios={isIos()}
        onInstall={installPrompt ? () => installPrompt?.prompt().then(() => (installPrompt = null)) : undefined}
        ondismiss={() => updateSettings({ installHintDismissed: true })}
      />
    {/if}

    <main>
      {#if view}
        <Board {view} {current} {revealRow} {shake} {bounceRow} />
      {/if}
      <div class="toast-area" aria-live="polite">
        {#if toast}<div class="toast">{toast.text}</div>{/if}
      </div>
    </main>

    <footer>
      {#if view && view.state !== 'playing' && !busy}
        <div class="over">
          {#if view.state === 'lost'}<span>{t('The word was')} <b>{view.solution?.toUpperCase()}</b></span>{/if}
          <button type="button" class="btn primary" onclick={openStats}>{t('Statistics')}</button>
        </div>
      {/if}
      <Keyboard {keys} {onkey} />
    </footer>
  </div>

  {#if sheet === 'help'}
    <HelpSheet onclose={() => (sheet = null)} />
  {:else if sheet === 'stats' && stats && view}
    <StatsSheet {stats} {view} onclose={() => (sheet = null)} onshare={share} />
  {:else if sheet === 'settings' && settings}
    <SettingsSheet
      {settings}
      hardLocked={!!view && view.state === 'playing' && view.rows.length > 0}
      onchange={updateSettings}
      onexport={exportBackup}
      onimport={importBackup}
      onclose={() => (sheet = null)}
    />
  {/if}
{/key}

<style>
  .app {
    display: flex;
    flex-direction: column;
    /* Pinned to the screen edges, not 100dvh: in an iOS home-screen app with a translucent status bar,
       100dvh is short by the status bar's height and leaves a gap below the keyboard. */
    position: fixed;
    inset: 0;
    padding-top: calc(env(safe-area-inset-top) + 14px); /* clear of the blurred status bar on iOS */
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    max-width: 560px;
    margin: 0 auto;
  }
  .top {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) 88px;
    align-items: center;
    padding: 4px 8px;
  }
  .right { justify-self: end; display: flex; }
  h1 {
    margin: 0;
    font: 900 1.9rem/1.15 var(--font-title);
    letter-spacing: 0.02em;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon {
    border: 0;
    background: none;
    color: var(--text);
    width: 44px;
    height: 44px;
    padding: 9px;
    border-radius: 50%;
  }
  .icon svg { width: 100%; height: 100%; display: block; }
  .number {
    margin: 0;
    text-align: center;
    color: var(--text-muted);
    font: 700 0.88rem var(--font-ui);
  }
  main {
    flex: 1;
    display: flex;
    position: relative;
    min-height: 0;
    margin: 10px 0;
    container-type: size;
  }
  .toast-area {
    position: absolute;
    top: 4px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 5;
  }
  .toast {
    background: var(--text);
    color: var(--bg);
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
    animation: fade 150ms ease-out;
  }
  @keyframes fade { from { opacity: 0; transform: translateY(-6px); } }
  footer { display: grid; gap: 10px; }
  .over {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0 12px;
  }
  .over span { width: 100%; text-align: center; }
  .over b { letter-spacing: 0.12em; }
</style>
