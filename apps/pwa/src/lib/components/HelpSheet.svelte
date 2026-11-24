<script lang="ts">
  import { msg, t } from '../i18n/index.js';
  import Sheet from './Sheet.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const examples = [
    { word: 'kranz', at: 0, mark: 'correct', text: msg('K is in the word and in the right place.') },
    { word: 'tasse', at: 1, mark: 'present', text: msg('A is in the word but in another place.') },
    { word: 'blume', at: 3, mark: 'absent', text: msg('M is not in the word.') },
  ] as const;
</script>

<Sheet title={t('How to play')} {onclose}>
  <p>{t('Guess the word in 6 tries. Every guess must be a German word with 5 letters.')}</p>
  <p>{t('After each guess the tiles show how close you are:')}</p>
  {#each examples as ex (ex.word)}
    <div class="example">
      {#each [...ex.word] as letter, i (i)}
        <span class="tile {i === ex.at ? ex.mark : ''}">{letter}</span>
      {/each}
    </div>
    <p class="caption">{t(ex.text)}</p>
  {/each}
  <ul>
    <li>{t('Ä, Ö and Ü are letters of their own. ß is written as SS.')}</li>
    <li>{t('A new word appears every day at midnight.')}</li>
    <li>{t('Hard mode: letters you have found must be used in every later guess.')}</li>
  </ul>
</Sheet>

<style>
  p, li { line-height: 1.45; }
  ul { padding-left: 1.2em; color: var(--text-muted); font-size: 0.92rem; }
  .example { display: flex; gap: 5px; margin-top: 14px; }
  .tile {
    width: 42px;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 2px solid var(--tile-border-filled);
    border-radius: 9px;
    font: 800 1.35rem var(--font-tile);
    text-transform: uppercase;
  }
  .tile.correct { background: var(--correct); color: var(--mark-text); border-color: transparent; }
  .tile.present {
    background: var(--present) radial-gradient(circle at 82% 18%, currentColor 0 2.5px, transparent 3px);
    color: var(--present-text);
    border-color: transparent;
  }
  .tile.absent { background: var(--absent); color: var(--mark-text); border-color: transparent; }
  .caption { margin: 6px 0 0; font-size: 0.92rem; }
</style>
