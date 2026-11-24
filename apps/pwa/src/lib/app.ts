// Composition root: the only place that knows both the core and the adapters (README §4).
import { createApp, type Clock } from '@wortl/core';
import { idbPorts, WortlDb } from '@wortl/storage-idb';
import { createWordList } from '@wortl/words';

const pad = (n: number) => String(n).padStart(2, '0');

const browserClock: Clock = {
  now: () => new Date().toISOString(),
  today: () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },
};

const uuid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const app = createApp({
  ...idbPorts(new WortlDb()),
  clock: browserClock,
  random: { next: Math.random },
  ids: { next: uuid },
  words: createWordList(),
});

/** Milliseconds until the next local midnight, when the next daily word appears. */
export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export const isStandalone = (): boolean =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export const isIos = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
