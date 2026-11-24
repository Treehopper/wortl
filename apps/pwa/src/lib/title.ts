// Undocumented `#title=…` in the URL: renames the game everywhere. It is stored in the settings, and it stays
// in the URL and in the manifest's start_url, so a home-screen app keeps it. On iOS the installed app has its
// own storage and only gets the URL.

export const DEFAULT_TITLE = 'Wortl';

/** The title in the URL: a string ('' resets it), or undefined when the URL has none. */
export function titleFromUrl(): string | undefined {
  const params = new URLSearchParams(location.hash.slice(1));
  return params.has('title') ? params.get('title')!.trim().slice(0, 30) : undefined;
}

let staticManifest: string | undefined;
let blobManifest: string | undefined;

/** Puts the custom title into the URL, the document and the install manifest, or removes it. */
export async function applyTitle(custom: string | undefined): Promise<void> {
  const title = custom || DEFAULT_TITLE;
  const hash = custom ? '#' + new URLSearchParams({ title: custom }).toString() : '';
  if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);

  document.title = title;
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', title);

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) return; // dev server without the PWA plugin
  staticManifest ??= link.href;
  if (blobManifest) URL.revokeObjectURL(blobManifest);
  blobManifest = undefined;
  if (!custom) {
    link.href = staticManifest;
    return;
  }
  try {
    const manifest = (await (await fetch(staticManifest)).json()) as Record<string, unknown> & { icons?: { src: string }[] };
    // A manifest from a blob: URL resolves nothing relative to the site, so every URL becomes absolute.
    const abs = (u: string) => new URL(u, staticManifest).href;
    const start = new URL(String(manifest.start_url ?? '.'), staticManifest);
    start.hash = hash;
    Object.assign(manifest, {
      name: title,
      short_name: title,
      id: abs(String(manifest.id ?? manifest.start_url ?? '.')),
      start_url: start.href,
      scope: abs(String(manifest.scope ?? '.')),
      icons: manifest.icons?.map((i) => ({ ...i, src: abs(i.src) })),
    });
    blobManifest = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
    link.href = blobManifest;
  } catch {
    // Offline before the manifest was cached: the URL and the stored setting still carry the title.
  }
}
