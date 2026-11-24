<script lang="ts">
  import type { Mark } from '@wortl/core';
  import { t } from '../i18n/index.js';

  interface Props {
    keys: Record<string, Mark>;
    onkey: (key: string) => void; // a letter, 'enter' or 'back'
  }
  let { keys, onkey }: Props = $props();

  // QWERTZ, with the umlauts where a German keyboard has them (A5).
  const rows = [
    [...'qwertzuiopü'],
    [...'asdfghjklöä'],
    ['enter', ...'yxcvbnm', 'back'],
  ];
</script>

<div class="keyboard" role="group" aria-label={t('Keyboard')}>
  {#each rows as row, r (r)}
    <div class="row">
      {#each row as key (key)}
        {#if key === 'enter'}
          <button type="button" class="key wide" onclick={() => onkey('enter')}>{t('Enter')}</button>
        {:else if key === 'back'}
          <button type="button" class="key wide" onclick={() => onkey('back')} aria-label={t('Delete')}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"/>
            </svg>
          </button>
        {:else}
          <button type="button" class="key {keys[key] ?? ''}" onclick={() => onkey(key)}>{key}</button>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .keyboard {
    display: grid;
    gap: 7px;
    width: min(100%, 520px);
    margin: 0 auto;
    padding: 0 4px;
    touch-action: manipulation;
  }
  .row {
    display: flex;
    gap: 4px;
  }
  .key {
    flex: 1 1 0;
    min-width: 0;
    height: 56px;
    border: 0;
    border-radius: 8px;
    background: var(--key-bg);
    color: var(--text);
    font: 700 1.05rem var(--font-ui);
    text-transform: uppercase;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 200ms;
  }
  .key:active { filter: brightness(0.88); }
  .key.wide { flex: 1.7 1 0; font-size: 0.72rem; letter-spacing: 0.02em; }
  .key.correct { background: var(--correct); color: var(--mark-text); }
  .key.present { background: var(--present); color: var(--present-text); }
  .key.absent { background: var(--absent); color: var(--mark-text); opacity: 0.75; }
</style>
