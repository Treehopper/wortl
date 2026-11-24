import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

/**
 * Undocumented `#title=…` and `#theme=…` (src/lib/url-settings.ts): on iOS, while either is in the URL, the page
 * has no manifest. Safari reads the manifest as the page loads, and with one it names the home-screen app after
 * the manifest and starts it at the manifest's start_url, losing the hash. Without one it uses the current URL and
 * apple-mobile-web-app-title. So the manifest link is added by a script in <head>, before Safari looks. The script
 * also applies both early, so the page does not flash the default theme or title.
 */
function manifestUnlessUrlSettingsOnIos(): Plugin {
  return {
    name: 'wortl:manifest-unless-url-settings-on-ios',
    enforce: 'post',
    // In generateBundle, because vite-plugin-pwa adds the link after the HTML transforms; before the service
    // worker is generated, so it precaches this HTML.
    generateBundle(_, bundle) {
      const page = bundle['index.html'];
      if (page?.type !== 'asset' || typeof page.source !== 'string') return;
      page.source = page.source.replace(/<link rel="manifest" href="([^"]+)">/, (_, href: string) => `<script>
    (function () {
      var params = new URLSearchParams(location.hash.slice(1));
      var title = (params.get('title') || '').trim().slice(0, 30);
      var theme = params.get('theme');
      var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (title) {
        document.title = title;
        document.querySelector('meta[name="apple-mobile-web-app-title"]').setAttribute('content', title);
      }
      if (/^(friendly|device|light|dark)$/.test(theme)) document.documentElement.dataset.theme = theme;
      else theme = null;
      if (ios && (title || theme)) return;
      var link = document.createElement('link');
      link.rel = 'manifest';
      link.href = ${JSON.stringify(href)};
      document.head.appendChild(link);
    })();
  </script>`);
    },
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Wortl',
        short_name: 'Wortl',
        description: 'Das tägliche Wörter-Rätsel – fünf Buchstaben, sechs Versuche.',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#f3f0ff',
        background_color: '#f3f0ff',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'] },
    }),
    manifestUnlessUrlSettingsOnIos(),
  ],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Set by the Pages workflow (/wortl/); relative otherwise, so any sub-path works.
  base: process.env.BASE_PATH ?? './',
  server: { host: true, port: 5317 },
  preview: { port: 4317 },
});
