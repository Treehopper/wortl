<script lang="ts">
  import { t } from '../i18n/index.js';

  interface Props {
    ios: boolean;
    onInstall?: () => void; // Android/Chrome install prompt, when the browser offers one
    ondismiss: () => void;
  }
  let { ios, onInstall, ondismiss }: Props = $props();
</script>

<div class="hint" role="note">
  <p>
    {#if ios}
      {t('Install Wortl: tap Share, then “Add to Home Screen”. Your streak is kept safely there.')}
    {:else}
      {t('Install Wortl on your home screen to play offline and keep your streak safe.')}
    {/if}
  </p>
  {#if onInstall}
    <button type="button" class="btn primary" onclick={onInstall}>{t('Install')}</button>
  {/if}
  <button type="button" class="dismiss" onclick={ondismiss} aria-label={t('Close')}>×</button>
</div>

<style>
  .hint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--key-bg);
    font-size: 0.85rem;
    line-height: 1.35;
  }
  p { margin: 0; flex: 1; }
  .btn { padding: 8px 14px; }
  .dismiss {
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 1.4rem;
    padding: 0 4px;
  }
</style>
