// Builds packages/words/src/words-de.json from public sources (see README §6).
// Usage: node tools/build-words/build.mjs   (downloads into tools/build-words/.cache)
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cache = join(here, '.cache');
const out = join(here, '../../packages/words/src/words-de.json');

const SOURCES = {
  dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/de/de_DE_frami.dic',
  aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/de/de_DE_frami.aff',
  freq: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt',
};
const LENGTH = 5;
const ANSWER_MAX_RANK = 25_000; // frequency rank limit for answer words
const SEED = 0x5707; // fixed: changing it reorders all daily words (rule 3 of §6)

async function fetchCached(name, url, encoding) {
  const file = join(cache, name);
  try {
    await access(file);
  } catch {
    await mkdir(cache, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return new TextDecoder(encoding).decode(await readFile(file));
}

/** Normalises a word to game letters; returns undefined when it has other characters. */
export function normalise(word) {
  const w = word.toLowerCase().replaceAll('ß', 'ss');
  return /^[a-zäöü]+$/.test(w) ? w : undefined;
}

function parseAff(text) {
  const rules = new Map(); // flag → { type, cross, entries[] }
  for (const line of text.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p[0] !== 'SFX' && p[0] !== 'PFX') continue;
    const [type, flag] = p;
    if (p.length === 4 && /^[YN]$/.test(p[2])) {
      rules.set(flag, { type, cross: p[2] === 'Y', entries: [] });
    } else if (p.length >= 5) {
      const [strip, addRaw, cond] = p.slice(2, 5);
      const [add, cont = ''] = addRaw.split('/');
      const re = cond === '.' ? null : new RegExp(type === 'SFX' ? `${cond}$` : `^${cond}`);
      rules.get(flag).entries.push({
        strip: strip === '0' ? '' : strip,
        add: add === '0' ? '' : add,
        re,
        circumfix: cont.includes('f'),
      });
    }
  }
  return rules;
}

function apply(rule, word) {
  const res = [];
  for (const e of rule.entries) {
    if (e.circumfix) continue; // needs a matching prefix; rare, skipped
    if (e.re && !e.re.test(word)) continue;
    if (rule.type === 'SFX') {
      if (e.strip && !word.endsWith(e.strip)) continue;
      res.push(word.slice(0, word.length - e.strip.length) + e.add);
    } else {
      if (e.strip && !word.startsWith(e.strip)) continue;
      res.push(e.add + word.slice(e.strip.length));
    }
  }
  return res;
}

function expand(word, flags, rules) {
  const forms = new Set();
  const needAffix = flags.includes('h');
  if (!needAffix) forms.add(word);
  const sfx = [...flags].map((f) => rules.get(f)).filter((r) => r?.type === 'SFX');
  const pfx = [...flags].map((f) => rules.get(f)).filter((r) => r?.type === 'PFX');
  const suffixed = [];
  for (const r of sfx) for (const f of apply(r, word)) { forms.add(f); if (r.cross) suffixed.push(f); }
  for (const r of pfx) {
    for (const f of apply(r, word)) forms.add(f);
    if (r.cross) for (const s of suffixed) for (const f of apply(r, s)) forms.add(f);
  }
  return forms;
}

/**
 * Answers are lemmas. Excluded: entries that need an affix (h), strong past forms listed
 * as their own entry (Z: "ankam", "wurde"), acronyms, and capitalised entries that can't
 * be part of a compound (m) — in igerman98 that is mostly names ("Jacob/S", "Miami").
 */
function isAnswerCandidate(word, flags) {
  if (/[hZ]/.test(flags) || word === word.toUpperCase()) return false;
  const capitalised = word[0] !== word[0].toLowerCase();
  return !capitalised || flags.includes('m');
}

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const [dic, aff, freq, exclude] = await Promise.all([
    fetchCached('de_DE_frami.dic', SOURCES.dic, 'latin1'),
    fetchCached('de_DE_frami.aff', SOURCES.aff, 'latin1'),
    fetchCached('de_50k.txt', SOURCES.freq, 'utf-8'),
    readFile(join(here, 'exclude.txt'), 'utf-8'),
  ]);
  const rules = parseAff(aff);
  const excluded = new Set(exclude.replace(/#.*/g, '').split(/\s+/).filter(Boolean));

  const rank = new Map();
  freq.split('\n').forEach((line, i) => {
    const w = normalise(line.split(' ')[0] ?? '');
    if (w && !rank.has(w)) rank.set(w, i + 1);
  });

  const allowed = new Set();
  const lemmas = new Set();
  for (const line of dic.split('\n').slice(1)) {
    if (!line || line.startsWith('#') || /^\s/.test(line)) continue;
    const [word, flags = ''] = line.trim().split('/');
    if (/[od]/.test(flags)) continue; // only inside compounds, or forbidden
    for (const form of expand(word, flags, rules)) {
      const n = normalise(form);
      if (n?.length === LENGTH) allowed.add(n);
    }
    const base = normalise(word);
    if (base?.length === LENGTH && isAnswerCandidate(word, flags)) lemmas.add(base);
  }

  const answers = [...lemmas]
    .filter((w) => (rank.get(w) ?? Infinity) <= ANSWER_MAX_RANK && !excluded.has(w))
    .sort();
  const random = mulberry32(SEED);
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  for (const a of answers) allowed.add(a);
  // The frequency list adds forms the affix rules can't build (umlaut plurals: "häuser").
  for (const w of rank.keys()) if (w.length === LENGTH) allowed.add(w);

  const pack = {
    id: 'words-de',
    length: LENGTH,
    sources: [
      { name: 'igerman98 / de_DE_frami (Hunspell)', url: SOURCES.dic, licence: 'GPL-2.0-or-later' },
      { name: 'FrequencyWords (OpenSubtitles 2018)', url: SOURCES.freq, licence: 'CC-BY-SA-4.0' },
    ],
    answers,
    allowed: [...allowed].filter((w) => !answers.includes(w)).sort().join(' '),
  };
  await writeFile(out, JSON.stringify(pack, null, 0) + '\n');
  console.log(`answers: ${answers.length}, allowed (incl. answers): ${allowed.size} → ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
