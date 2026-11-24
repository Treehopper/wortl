<script lang="ts">
  import type { GameView } from '@wortl/core';
  import { msg, t } from '../i18n/index.js';

  interface Props {
    view: GameView;
    current: string[];
    revealRow: number; // row whose tiles flip now, -1 for none
    shake: boolean;
    bounceRow: number;
  }
  let { view, current, revealRow, shake, bounceRow }: Props = $props();

  const markLabel = { correct: msg('right place'), present: msg('wrong place'), absent: msg('not in the word') };

  const grid = $derived(
    Array.from({ length: view.maxGuesses }, (_, r) => {
      const row = view.rows[r];
      if (row) return row.letters.map((l, i) => ({ letter: l, mark: row.marks[i] }));
      const typed = r === view.rows.length && view.state === 'playing' ? current : [];
      return Array.from({ length: view.length }, (_, i) => ({ letter: typed[i] ?? '', mark: undefined }));
    }),
  );
</script>

<div class="board" role="grid" aria-label={t('Guesses')}>
  {#each grid as row, r (r)}
    <div
      class="row"
      class:shake={shake && r === view.rows.length}
      class:bounce={r === bounceRow}
      role="row"
    >
      {#each row as tile, i (i)}
        <div
          class="tile {tile.mark ?? ''}"
          class:filled={tile.letter !== ''}
          class:reveal={r === revealRow}
          style:--i={i}
          role="gridcell"
          aria-label={tile.mark ? `${tile.letter.toUpperCase()}, ${t(markLabel[tile.mark])}` : tile.letter.toUpperCase()}
        >
          {tile.letter}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    /* Sized by the free space of its container (main has container-type: size). */
    --board-w: min(340px, calc(100cqw - 40px), calc(100cqh * 5 / 6));
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    gap: 6px;
    width: var(--board-w);
    margin: auto;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .tile {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 2px solid var(--tile-border);
    border-radius: var(--tile-radius);
    background: var(--tile-bg);
    color: var(--text);
    font: 800 calc(var(--board-w) / 9.5) / 1 var(--font-tile);
    text-transform: uppercase;
    user-select: none;
  }
  .tile.filled {
    border-color: var(--tile-border-filled);
    animation: pop 90ms ease-out;
  }
  .tile.correct,
  .tile.present,
  .tile.absent {
    border-color: transparent;
    color: var(--mark-text);
    animation: none;
  }
  .tile.correct { background: var(--correct); }
  .tile.present { background: var(--present); color: var(--present-text); }
  .tile.absent { background: var(--absent); }
  /* Present tiles carry a corner dot, so the hint doesn't rely on colour alone. */
  .tile.present { background-image: radial-gradient(circle at 82% 18%, currentColor 0 3px, transparent 3.5px); }

  .tile.reveal {
    animation: flip 520ms ease-in-out both;
    animation-delay: calc(var(--i) * 260ms);
  }
  @keyframes flip {
    0% { transform: rotateX(0); background: var(--tile-bg); color: var(--text); border-color: var(--tile-border-filled); background-image: none; }
    49.9% { transform: rotateX(90deg); background: var(--tile-bg); color: var(--text); border-color: var(--tile-border-filled); background-image: none; }
    50% { transform: rotateX(90deg); }
    100% { transform: rotateX(0); }
  }
  @keyframes pop {
    50% { transform: scale(1.08); }
  }
  .shake { animation: shake 400ms ease-in-out; }
  @keyframes shake {
    20%, 60% { transform: translateX(-7px); }
    40%, 80% { transform: translateX(7px); }
  }
  .bounce .tile {
    animation: bounce 600ms ease both;
    animation-delay: calc(var(--i) * 90ms);
  }
  @keyframes bounce {
    30% { transform: translateY(-22%); }
    55% { transform: translateY(4%); }
    75% { transform: translateY(-6%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .tile, .shake, .bounce .tile, .tile.reveal { animation: none !important; }
  }
</style>
