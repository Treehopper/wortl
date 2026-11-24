// Undocumented URL settings: `#title=…` renames the game everywhere, `#theme=…` (friendly, device, light, dark)
// picks the theme. Both are stored in the settings and kept in the URL, so a home-screen app keeps them
// (see applyUrlSettings).
import { DEFAULT_SETTINGS, type Settings, type Theme } from '@wortl/core';

export const DEFAULT_TITLE = 'Wortl';
const THEMES: readonly Theme[] = ['friendly', 'device', 'light', 'dark'];

/** The settings named in the URL; `#title=` (empty) resets the title. */
export function settingsFromUrl(): Partial<Settings> {
  const params = new URLSearchParams(location.hash.slice(1));
  const patch: Partial<Settings> = {};
  if (params.has('title')) patch.customTitle = params.get('title')!.trim().slice(0, 30);
  const theme = params.get('theme') as Theme | null;
  if (theme && THEMES.includes(theme)) patch.theme = theme;
  return patch;
}

let manifest: HTMLLinkElement | null | undefined;

/** Puts the title and a non-default theme into the URL, and the title into the document. */
export function applyUrlSettings(s: Settings, ios: boolean): void {
  const params = new URLSearchParams();
  if (s.customTitle) params.set('title', s.customTitle);
  if (s.theme !== DEFAULT_SETTINGS.theme) params.set('theme', s.theme);
  const hash = params.size ? '#' + params.toString() : '';
  if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);

  const title = s.customTitle || DEFAULT_TITLE;
  document.title = title;
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', title);

  // iOS gives a home-screen app its own storage and starts it at the manifest's start_url, which has no hash.
  // Without a manifest it starts at the current URL (with the hash) and still opens full screen, because of
  // apple-mobile-web-app-capable. Safari reads the manifest on load, so the script in <head> (vite.config.ts)
  // decides first; this keeps it right after a change. Android keeps the manifest: an installed app there shares
  // the browser's storage, so the stored settings carry over. A generated manifest (blob: URL) is no way out:
  // Chrome cannot install from one and falls back to a plain shortcut with browser controls.
  manifest ??= document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest || !ios) return;
  if (hash) manifest.remove();
  else if (!manifest.isConnected) document.head.append(manifest);
}
