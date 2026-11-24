<script lang="ts">
  import type { GameView, Stats } from '@wortl/core';
  import { msUntilMidnight } from '../app.js';
  import { fmt, pct, t } from '../i18n/index.js';
  import Sheet from './Sheet.svelte';

  interface Props {
    stats: Stats;
    view: GameView;
    onclose: () => void;
    onshare: () => void;
    onnewpractice: () => void;
  }
  let { stats, view, onclose, onshare, onnewpractice }: Props = $props();

  const over = $derived(view.state !== 'playing');
  const maxBar = $derived(Math.max(1, ...stats.distribution));
  const highlight = $derived(view.state === 'won' ? view.rows.length - 1 : -1);

  let left = $state(msUntilMidnight());
  $effect(() => {
    const timer = setInterval(() => (left = msUntilMidnight()), 1000);
    return () => clearInterval(timer);
  });
  const countdown = $derived(
    [Math.floor(left / 3_600_000), Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60]
      .map((n) => String(n).padStart(2, '0'))
      .join(':'),
  );
</script>

<Sheet title={view.mode === 'daily' ? t('Statistics · daily word') : t('Statistics · practice')} {onclose}>
  {#if over}
    <p class="result" class:won={view.state === 'won'}>
      {#if view.state === 'won'}
        {t('Solved in {n} of {max}', { n: view.rows.length, max: view.maxGuesses })}
      {:else}
        {t('The word was')} <strong>{view.solution?.toUpperCase()}</strong>
      {/if}
    </p>
  {/if}

  <div class="numbers">
    <div><b>{fmt(stats.played)}</b><span>{t('Played')}</span></div>
    <div><b>{pct(stats.winRate)}</b><span>{t('Won')}</span></div>
    <div><b>{fmt(stats.currentStreak)}</b><span>{t('Streak')}</span></div>
    <div><b>{fmt(stats.maxStreak)}</b><span>{t('Best streak')}</span></div>
  </div>

  <h3>{t('Guesses needed')}</h3>
  <ol class="dist">
    {#each stats.distribution as count, i (i)}
      <li>
        <span class="n">{i + 1}</span>
        <span class="bar" class:hl={i === highlight} style:width="{Math.max(8, (count / maxBar) * 100)}%">{fmt(count)}</span>
      </li>
    {/each}
  </ol>

  {#if over}
    <div class="actions">
      {#if view.mode === 'daily'}
        <div class="next">
          <span>{t('Next word in')}</span>
          <b>{countdown}</b>
        </div>
      {:else}
        <button type="button" class="btn secondary" onclick={onnewpractice}>{t('New word')}</button>
      {/if}
      <button type="button" class="btn primary" onclick={onshare}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
        {t('Share')}
      </button>
    </div>
  {/if}
</Sheet>

<style>
  .result {
    margin: 4px 0 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--absent);
    color: var(--mark-text);
    font-weight: 600;
    text-align: center;
  }
  .result.won { background: var(--correct); }
  .result strong { letter-spacing: 0.12em; }
  .numbers {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    text-align: center;
    gap: 4px;
  }
  .numbers b { display: block; font: 800 1.9rem/1.1 var(--font-ui); font-variant-numeric: tabular-nums; }
  .numbers span { font-size: 0.75rem; color: var(--text-muted); }
  h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; margin: 22px 0 8px; color: var(--text-muted); }
  .dist { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
  .dist li { display: flex; align-items: center; gap: 8px; }
  .n { width: 1em; font-weight: 700; font-variant-numeric: tabular-nums; }
  .bar {
    background: var(--absent);
    color: var(--mark-text);
    border-radius: 6px;
    padding: 2px 8px;
    text-align: right;
    font-weight: 700;
    font-size: 0.85rem;
    min-width: max-content;
    box-sizing: border-box;
  }
  .bar.hl { background: var(--correct); }
  .actions { display: flex; gap: 12px; align-items: center; margin-top: 22px; }
  .actions > * { flex: 1; }
  .next { text-align: center; }
  .next span { display: block; font-size: 0.8rem; color: var(--text-muted); }
  .next b { font: 800 1.6rem var(--font-ui); font-variant-numeric: tabular-nums; }
</style>
