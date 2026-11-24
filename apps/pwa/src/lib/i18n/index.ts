// App language (README §8.4). Texts are keyed by their English wording; German lives in de/.
import type { UiLanguage } from '@wortl/core';
import { de } from './de/index.js';

export type Lang = 'en' | 'de';
type Params = Record<string, string | number>;

let lang: Lang = 'en';

export function resolveLanguage(setting: UiLanguage, deviceLanguages: readonly string[] = navigator.languages): Lang {
  if (setting !== 'device') return setting;
  return deviceLanguages[0]?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function setLanguage(l: Lang): void {
  lang = l;
  document.documentElement.lang = l;
}

export const language = (): Lang => lang;

function fill(text: string, params?: Params): string {
  return params ? text.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? fmtParam(params[k]!) : `{${k}}`)) : text;
}
const fmtParam = (v: string | number) => (typeof v === 'number' ? fmt(v) : v);

/** Marks a text that is translated later with t(), so the i18n test finds it. */
export const msg = (key: string): string => key;

export function t(key: string, params?: Params): string {
  return fill((lang === 'de' && de[key]) || key, params);
}

export function tn(n: number, one: string, other: string, params?: Params): string {
  return t(n === 1 ? one : other, { n, ...params });
}

export const fmt = (n: number): string => new Intl.NumberFormat(lang).format(n);
export const pct = (x: number): string => new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(x);
