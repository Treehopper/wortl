// App texts (README §8.4). Texts are keyed by their English wording; the German lives in de/.
import { de } from './de/index.js';

type Params = Record<string, string | number>;

let title = 'Wortl';

/** The game's name, filled into `{title}` in every text. */
export function setTitle(name: string): void {
  title = name;
}

export const appTitle = (): string => title;

function fill(text: string, params: Params): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? fmtParam(params[k]!) : `{${k}}`));
}
const fmtParam = (v: string | number) => (typeof v === 'number' ? fmt(v) : v);

/** Marks a text that is translated later with t(), so the i18n test finds it. */
export const msg = (key: string): string => key;

export function t(key: string, params?: Params): string {
  return fill(de[key] ?? key, { title, ...params });
}

export function tn(n: number, one: string, other: string, params?: Params): string {
  return t(n === 1 ? one : other, { n, ...params });
}

export const fmt = (n: number): string => new Intl.NumberFormat('de').format(n);
export const pct = (x: number): string => new Intl.NumberFormat('de', { style: 'percent', maximumFractionDigits: 0 }).format(x);
