import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

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
  ],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Set by the Pages workflow (/wortl/); relative otherwise, so any sub-path works.
  base: process.env.BASE_PATH ?? './',
  server: { host: true, port: 5317 },
  preview: { port: 4317 },
});
