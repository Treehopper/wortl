import type { WordList } from '@wortl/core';
import pack from './words-de.json' with { type: 'json' };

export interface WordPack {
  id: string;
  length: number;
  sources: { name: string; url: string; licence: string }[];
  answers: string[];
  /** Space-separated valid guesses that are not answers. */
  allowed: string;
}

export const wordsDe: WordPack = pack;

export function createWordList(p: WordPack = wordsDe): WordList {
  const allowed = new Set(p.allowed.split(' '));
  for (const a of p.answers) allowed.add(a);
  return { length: p.length, answers: p.answers, isAllowed: (w) => allowed.has(w) };
}
