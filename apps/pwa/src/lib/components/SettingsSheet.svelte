<script lang="ts">
  import type { Settings } from '@wortl/core';
  import { wordsDe } from '@wortl/words';
  import { appTitle, fmt, t } from '../i18n/index.js';
  import Sheet from './Sheet.svelte';

  interface Props {
    settings: Settings;
    hardLocked: boolean; // current game already has guesses
    onchange: (patch: Partial<Settings>) => void;
    onexport: () => void;
    onimport: (file: File) => void;
    onclose: () => void;
  }
  let { settings, hardLocked, onchange, onexport, onimport, onclose }: Props = $props();

  let info = $state<string | null>(null);
  const toggleInfo = (key: string) => (info = info === key ? null : key);
</script>

{#snippet infoButton(key: string)}
  <button type="button" class="info" aria-expanded={info === key} aria-label={t('More about this setting')} onclick={() => toggleInfo(key)}>i</button>
{/snippet}

<Sheet title={t('Settings')} {onclose}>
  <section>
    <div class="setting">
      <div class="label">
        <span>{t('Hard mode')}</span>{@render infoButton('hard')}
      </div>
      <input type="checkbox" role="switch" checked={settings.hardMode} onchange={(e) => onchange({ hardMode: e.currentTarget.checked })} />
    </div>
    {#if info === 'hard'}
      <p class="explain">
        {t('Letters you have found must be used in every later guess, and letters in the right place must stay there. Shared results are marked with *.')}
        {#if hardLocked}{t('A change applies from the next game, because the current one has started.')}{/if}
      </p>
    {/if}

    <div class="setting">
      <div class="label">
        <span>{t('High-contrast colours')}</span>{@render infoButton('contrast')}
      </div>
      <input type="checkbox" role="switch" checked={settings.highContrast} onchange={(e) => onchange({ highContrast: e.currentTarget.checked })} />
    </div>
    {#if info === 'contrast'}
      <p class="explain">{t('Orange and blue for the hints, easier to tell apart with colour vision deficiency.')}</p>
    {/if}

    <label class="setting">
      <span class="label">{t('Theme')}</span>
      <select value={settings.theme} onchange={(e) => onchange({ theme: e.currentTarget.value as Settings['theme'] })}>
        <option value="friendly">{t('Friendly')}</option>
        <option value="device">{t('Paper, like the device')}</option>
        <option value="light">{t('Paper, light')}</option>
        <option value="dark">{t('Paper, dark')}</option>
      </select>
    </label>
  </section>

  <section>
    <h3>{t('Backup')}</h3>
    <p class="muted">{t('Your games and statistics are stored only on this device. Save a backup before changing phones.')}</p>
    <div class="buttons">
      <button type="button" class="btn secondary" onclick={onexport}>{t('Export')}</button>
      <label class="btn secondary">
        {t('Import')}
        <input type="file" accept=".json,application/json" hidden onchange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) onimport(file);
          e.currentTarget.value = '';
        }} />
      </label>
    </div>
  </section>

  <section>
    <h3>{t('About {title}')}</h3>
    <p class="muted">
      {t('{answers} daily words, {allowed} accepted words.', { answers: wordsDe.answers.length, allowed: fmt(wordsDe.allowed.split(' ').length + wordsDe.answers.length) })}
      {t('Word lists built from:')}
    </p>
    <ul class="muted">
      {#each wordsDe.sources as s (s.url)}
        <li><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a> ({s.licence})</li>
      {/each}
    </ul>
    <p class="muted">{appTitle()} {__APP_VERSION__}</p>
  </section>
</Sheet>

<style>
  section { padding: 8px 0; border-bottom: 1px solid var(--tile-border); }
  section:last-child { border-bottom: 0; }
  h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0 4px; color: var(--text-muted); }
  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    gap: 12px;
  }
  .label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
  .info {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid var(--text-muted);
    background: none;
    color: var(--text-muted);
    font: italic 700 0.8rem/1 Georgia, serif;
    padding: 0;
  }
  .explain { margin: -4px 0 10px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.45; }
  .muted { color: var(--text-muted); font-size: 0.9rem; line-height: 1.45; }
  ul.muted { padding-left: 1.2em; margin-top: 0; }
  a { color: inherit; }
  select {
    font: inherit;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--tile-border);
    background: var(--key-bg);
    color: var(--text);
  }
  input[role='switch'] {
    appearance: none;
    width: 50px;
    height: 30px;
    border-radius: 15px;
    background: var(--tile-border);
    position: relative;
    transition: background 150ms;
    flex: none;
    margin: 0;
  }
  input[role='switch']::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
    transition: transform 150ms;
  }
  input[role='switch']:checked { background: var(--correct); }
  input[role='switch']:checked::after { transform: translateX(20px); }
  .buttons { display: flex; gap: 12px; margin: 8px 0; }
  .buttons > * { flex: 1; }
</style>
