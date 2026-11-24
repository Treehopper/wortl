import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { de } from './de/index.js';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|svelte)$/.test(f) && !f.endsWith('.test.ts') ? [p] : [];
  });
}

const src = join(import.meta.dirname, '../..');
const keys = new Set<string>();
for (const f of files(src)) {
  for (const m of readFileSync(f, 'utf-8').matchAll(/\b(?:t|tn|msg)\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]!);
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('German texts (README §8.4)', () => {
  it('finds the texts', () => expect(keys.size).toBeGreaterThan(40));
  it.each([...keys])('has German for “%s” with the same placeholders', (key) => {
    expect(de[key], 'missing German').toBeDefined();
    expect(placeholders(de[key]!)).toEqual(placeholders(key));
  });
  it('has no German without a use', () => {
    expect(Object.keys(de).filter((k) => !keys.has(k))).toEqual([]);
  });
});
