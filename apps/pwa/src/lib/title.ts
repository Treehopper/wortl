// Undocumented `#title=…` in the URL: renames the game everywhere. It is stored in the settings and stays in
// the URL, so a home-screen app keeps it (see applyTitle).

export const DEFAULT_TITLE = 'Wortl';

/** The title in the URL: a string ('' resets it), or undefined when the URL has none. */
export function titleFromUrl(): string | undefined {
  const params = new URLSearchParams(location.hash.slice(1));
  return params.has('title') ? params.get('title')!.trim().slice(0, 30) : undefined;
}

let manifest: HTMLLinkElement | null | undefined;

/** Puts the custom title into the URL and the document, or removes it. */
export function applyTitle(custom: string | undefined, ios: boolean): void {
  const title = custom || DEFAULT_TITLE;
  const hash = custom ? '#' + new URLSearchParams({ title: custom }).toString() : '';
  if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);

  document.title = title;
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', title);

  // iOS gives a home-screen app its own storage and starts it at the manifest's start_url, which has no title.
  // Without a manifest it starts at the current URL (with the title) and still opens full screen, because of
  // apple-mobile-web-app-capable. Android keeps the manifest: an installed app there shares the browser's storage,
  // so the stored title carries over. A generated manifest (blob: URL) is no way out: Chrome cannot install from
  // one and falls back to a plain shortcut with browser controls.
  manifest ??= document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest || !ios) return;
  if (custom) manifest.remove();
  else if (!manifest.isConnected) document.head.append(manifest);
}
