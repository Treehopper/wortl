<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '../i18n/index.js';

  interface Props {
    title: string;
    onclose: () => void;
    children: Snippet;
  }
  let { title, onclose, children }: Props = $props();

  let dialog: HTMLDialogElement;
  $effect(() => {
    dialog.showModal();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  aria-label={title}
  onclose={onclose}
  onclick={(e) => e.target === dialog && dialog.close()}
>
  <div class="panel">
    <header>
      <h2>{title}</h2>
      <button type="button" class="close" onclick={() => dialog.close()} aria-label={t('Close')}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </header>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    border: 0;
    padding: 0;
    margin: auto auto 0;
    width: 100%;
    max-width: 520px;
    max-height: 92dvh;
    border-radius: 20px 20px 0 0;
    background: var(--sheet-bg);
    color: var(--text);
    box-shadow: 0 -8px 40px rgb(0 0 0 / 0.25);
    animation: up 220ms ease-out;
  }
  @media (min-width: 600px) {
    dialog { margin: auto; border-radius: 20px; }
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }
  .panel {
    padding: 8px 20px calc(24px + env(safe-area-inset-bottom));
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--sheet-bg);
    padding: 12px 0 8px;
    z-index: 1;
  }
  h2 {
    margin: 0;
    font: 800 1.25rem var(--font-ui);
  }
  .close {
    border: 0;
    background: none;
    color: var(--text-muted);
    padding: 8px;
    margin-right: -8px;
  }
  @keyframes up {
    from { transform: translateY(40px); opacity: 0; }
  }
</style>
