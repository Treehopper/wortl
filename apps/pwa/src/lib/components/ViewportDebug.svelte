<script lang="ts">
  // Undocumented: five quick taps on the title show live viewport measurements, to diagnose the iOS gap
  // below the keyboard. Values that change are logged with the seconds since launch.
  let { onclose }: { onclose: () => void } = $props();

  let probe: HTMLDivElement;
  let now = $state<Record<string, string>>({});
  let log = $state<string[]>([]);

  $effect(() => {
    let last: Record<string, string> = {};
    const read = () => {
      const s = getComputedStyle(probe);
      const app = document.querySelector('.app')?.getBoundingClientRect();
      const kb = document.querySelector('footer')?.getBoundingClientRect();
      const v: Record<string, string> = {
        screen: `${screen.width}×${screen.height}`,
        inner: `${innerWidth}×${innerHeight}`,
        client: `${document.documentElement.clientWidth}×${document.documentElement.clientHeight}`,
        visual: visualViewport ? `${Math.round(visualViewport.height)} @${Math.round(visualViewport.offsetTop)} ×${visualViewport.scale.toFixed(2)}` : '-',
        safe: `t${s.paddingTop} b${s.paddingBottom}`,
        app: app ? `${Math.round(app.top)}–${Math.round(app.bottom)}` : '-',
        keyboard: kb ? `${Math.round(kb.top)}–${Math.round(kb.bottom)}` : '-',
        scroll: `${scrollY}`,
        standalone: String((navigator as { standalone?: boolean }).standalone ?? matchMedia('(display-mode: standalone)').matches),
      };
      const t = (performance.now() / 1000).toFixed(1);
      for (const k of Object.keys(v)) if (last[k] !== undefined && last[k] !== v[k]) log = [`${t}s ${k}: ${last[k]} → ${v[k]}`, ...log].slice(0, 12);
      last = v;
      now = v;
    };
    read();
    const timer = setInterval(read, 250);
    return () => clearInterval(timer);
  });
</script>

<div class="probe" bind:this={probe}></div>
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="debug" onclick={onclose}>
  {#each Object.entries(now) as [k, v] (k)}<div><b>{k}</b> {v}</div>{/each}
  {#if log.length}<hr />{/if}
  {#each log as line, i (i)}<div>{line}</div>{/each}
  <div class="hint">tap to close</div>
</div>

<style>
  .probe {
    position: fixed;
    visibility: hidden;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .debug {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 60px);
    left: 8px;
    right: 8px;
    z-index: 100;
    background: rgb(0 0 0 / 0.82);
    color: #fff;
    font: 12px/1.4 ui-monospace, Menlo, monospace;
    padding: 8px 10px;
    border-radius: 8px;
  }
  hr { border: 0; border-top: 1px solid #fff5; margin: 6px 0; }
  .hint { opacity: 0.6; margin-top: 4px; }
</style>
