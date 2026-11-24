# Wortl – das tägliche Wörter-Rätsel

A Progressive Web App (iOS first, Android second) for a German five-letter word-guessing game. Everyone gets the same **daily word**; you have six tries, and after each try the tiles show which letters are in the right place, which are in the word but elsewhere, and which are not in it at all. A **practice mode** gives unlimited extra words. Statistics and streaks are kept on the device.

The target player is a German speaker who plays one round a day, often on the phone. Three design rules follow from that:
1. **Words must feel fair.** Solutions are common German lemmas: no names, places, English words, plurals or conjugated forms (§6). Guesses may be any valid German word form.
2. **Nothing is lost.** Closing the app mid-game, losing the network or reinstalling (with a backup) never costs a game or a streak.
3. **One glance, one thumb.** The board and keyboard fit on the smallest supported phone without scrolling; everything is reachable with the thumb.

---

## 1. Goals and non-goals

**Goals**
- A daily German word puzzle that is the same for every player on the same date.
- Fully offline after the first visit: the word lists ship with the app.
- Domain logic and storage have **no UI dependencies**, so they can move to a backend later without a rewrite.

**Non-goals (v1)**
- No accounts, sync, leaderboards or server (but the design prepares for it, see §7.7).
- No word lengths other than five, no languages other than German.
- No push notifications.

---

## 2. User stories

IDs are referenced in the design. "Must" = v1, "Should" = v1 if cheap, "Could" = later. IDs are stable; gaps and order have no meaning.

### Epic A – Playing

| ID | Story | Priority |
|----|-------|----------|
| A1 | As a player, I want one daily word that is the same for everyone, numbered ("Tageswort #12"), so I can compare with friends. | Must |
| A2 | As a player, I want six tries to guess a five-letter word. | Must |
| A3 | As a player, I want each letter of a guess marked as *right place*, *wrong place* or *not in the word*, with repeated letters handled correctly. | Must |
| A4 | As a player, I want guesses that aren't German words rejected without costing a try. | Must |
| A5 | As a player, I want an on-screen QWERTZ keyboard with Ä, Ö, Ü that shows what I know about each letter, and my physical keyboard to work too. | Must |
| A6 | As a player, I want Ä, Ö and Ü treated as letters of their own, and ß written as SS. | Must |
| A7 | As a player, I want to close the app at any time and continue exactly where I was. | Must |
| A8 | As a player, I want to see the solution when I lose. | Must |
| A9 | As a player, I want a practice mode with unlimited words that never spoils today's daily word. | Should |
| A10 | As a player, I want a hard mode in which every hint I found must be used in later guesses. | Should |

**Acceptance criteria (A1–A10)**
- The daily word changes at local midnight. A game left open over midnight stays as it was; the next daily game appears when the app comes back to the foreground.
- Marks follow §7.1: exact hits first, then *wrong place* left to right while unmatched copies of the letter remain.
- A rejected guess shakes the row and shows the reason: *Zu wenige Buchstaben*, *Nicht in der Wortliste*, or the hard-mode rule broken (*Buchstabe 2 muss A sein*, *Das Wort muss K enthalten*). The typed letters stay so the player can fix them.
- The keyboard shows the best mark per letter, updated only after the reveal animation ends.
- Hard mode is fixed by a game's first guess; changing the setting mid-game applies from the next game, and the settings screen says so.
- Starting a new practice word while one with guesses is open asks for confirmation and counts the open one as lost.

### Epic B – Statistics and sharing

| ID | Story | Priority |
|----|-------|----------|
| B1 | As a player, I want to see games played, win rate, current and best streak, and how many guesses my wins needed, separately for daily and practice games. | Must |
| B2 | As a player, I want to share my result without spoiling the word. | Must |
| B3 | As a player, I want a short celebration when I win. | Should |
| B4 | As a player with colour vision deficiency, I want colours I can tell apart. | Should |

**Acceptance criteria (B1–B4)**
- Statistics open by themselves about 2 s after a game ends; the daily sheet shows a countdown to the next word, the practice sheet a *Neues Wort* button.
- A daily streak counts wins on consecutive dates; a loss or a missed day ends it. The current streak is still shown on the day after the last win (§7.4).
- The shared text is `Wortl #12 4/6*` plus one row of circles per guess in the colours of the current theme (🟣 🟠 ⚪ friendly, 🟢 🟡 ⚫ paper, 🟠 🔵 ⚫ high contrast); `*` marks hard mode. On phones it uses the system share sheet, elsewhere the clipboard.
- *Wrong place* tiles carry a corner dot in addition to their colour. High-contrast mode switches to orange/blue.
- Confetti and the win bounce respect `prefers-reduced-motion`.

### Epic C – Setup and data safety

| ID | Story | Priority |
|----|-------|----------|
| C1 | As a player, I want to install the app on my iPhone home screen so it feels native and my streak is kept. | Must |
| C2 | As a new player, I want a short explanation of the rules on first start. | Must |
| C3 | As a player, I want to export all my games to a JSON file and import them again, so I don't lose my streak if iOS clears storage or I change phones. | Must |
| C4 | As a player, I want a choice of themes (including dark) and English or German app texts. | Should |
| C5 | As a player, I want to see where the word lists come from and under which licences. | Must |

**Acceptance criteria (C1–C5)**
- In Safari on iOS (not installed) a dismissible hint explains *Teilen → Zum Home-Bildschirm*; on Android the browser's install prompt is offered as a button.
- *How to play* opens once on first start and from the (?) button.
- Import validates the file, asks before replacing everything, and replaces all games and settings in one transaction.
- Settings › Theme: *Freundlich* (default, light), or the paper theme: *wie das Gerät*, *hell*, *dunkel*. Settings › App language: *Wie das Gerät* (default), *English*, *Deutsch*.

---

## 3. Key decisions

| Topic | Decision | Why |
|---|---|---|
| Platform | Installable PWA, `display: standalone` | iOS Home Screen apps get their own storage container and are exempt from Safari's 7-day purge for ordinary tabs. |
| Language | TypeScript (strict) | Same code runs in browser and Node (tests, tools). |
| UI | Svelte 5 + Vite + `vite-plugin-pwa` (Workbox) | Small bundle, fast on mobile. Swappable because the core doesn't know about it. |
| Storage | IndexedDB via Dexie, behind repository interfaces | Transactional; survives app updates; the same ports have in-memory fakes for tests. |
| Word lists | **Built at build time from public sources, shipped in the bundle** (~55 KB raw, ~25 KB gzip) | No download step, works offline from the first visit, reproducible. |
| Solutions vs. guesses | Two lists: curated lemmas as solutions, all valid word forms as guesses | Fair solutions without rejecting reasonable guesses like *hatte* or *bäume*. |
| Daily word | `answers[(dayNumber − 1) mod n]`, answers shuffled once with a fixed seed | Same word for everyone without a server; deterministic and testable. |
| Statistics | Derived from finished games, never stored | No counters to get out of sync; backup is just the games. |
| Heavy work | None; everything runs on the main thread | A guess is a few set lookups. (VocabFirst needed a worker; Wortl doesn't.) |

---

## 4. Architecture

```
┌──────────────────────────────────────────────────────────┐
│ apps/pwa  (Svelte UI, animations, keyboard, sheets)      │
│   depends on ▼ only through the Application API          │
├──────────────────────────────────────────────────────────┤
│ packages/core  (pure TypeScript, no DOM, no IndexedDB)   │
│   domain/      evaluate, hard mode, daily number, stats, │
│                share text                                │
│   services/    GameService, SettingsService              │
│   ports/       repository + infrastructure interfaces    │
│   app.ts       createApp(ports) → Application API        │
│   testing/     in-memory ports for tests                 │
├──────────────────────────────────────────────────────────┤
│ adapters (implement ports)                               │
│   packages/storage-idb     Dexie repositories            │
│   packages/words           shipped word pack + WordList  │
│   (later) storage-http     REST client for a backend     │
├──────────────────────────────────────────────────────────┤
│ tools/build-words  (Node; run by hand, output committed) │
└──────────────────────────────────────────────────────────┘
```

**Rules**
1. `core` imports nothing from `apps/` or any adapter. Enforced with an ESLint `no-restricted-imports` rule.
2. `core` uses no browser globals (`window`, `document`, `indexedDB`, `localStorage`, `navigator`). It compiles against `lib: ["ES2022"]` without `"DOM"`; ESLint also forbids the globals.
3. Time, IDs and randomness are injected (`Clock`, `IdGenerator`, `Random`); ESLint forbids `Date.now()` and `Math.random()` in `core`.
4. The UI only calls the **Application API** (a facade). `apps/pwa/src/lib/app.ts` is the only file that wires core and adapters together.

### 4.1 Ports (`core/src/ports`)

```ts
interface GameRepository { get(id); list(mode?); save(game); clear(); }
interface MetaRepository { get<T>(key); set<T>(key, value); clear(); }   // settings, current practice game
interface UnitOfWork     { run<T>(fn: () => Promise<T>): Promise<T>; }    // Dexie transaction over all tables
interface Clock          { now(): Timestamp; today(): LocalDate; }        // today() = player's local date
interface Random         { next(): number; }
interface IdGenerator    { next(): string; }
interface WordList       { length: number; answers: readonly string[]; isAllowed(word): boolean; }
```

### 4.2 Application API (what the UI calls)

```ts
interface WortlApp {
  games: {
    daily(): Promise<GameView>;                       // today's game, created on first access (A1, A7)
    practice(): Promise<GameView>;                    // open practice game or a new one (A9)
    newPractice(): Promise<GameView>;                 // abandons an open game with guesses as lost
    get(id): Promise<GameView | undefined>;
    guess(id, word): Promise<GuessResult>;            // { ok: true, view } | { ok: false, error, view }
    share(id, url?): Promise<string>;                 // B2
  };
  stats:    { get(mode): Promise<Stats> };            // B1
  settings: { get(): Promise<Settings>; update(patch): Promise<Settings> };
  backup:   { export(): Promise<BackupV1>; import(data: unknown): Promise<void> };  // C3
}

type GuessError = { kind: 'finished' } | { kind: 'tooShort' } | { kind: 'notInList' }
                | { kind: 'hard'; violation: { kind: 'position'; letter; position } | { kind: 'missing'; letter; count } };
```

`GameView` contains the rows (letters and marks), the keyboard marks, the state, the hard flag and — only once the game is over — the solution, so the UI can't leak it. Errors are typed, not texts; the UI translates them. All values are plain serialisable objects, so the same API can be served over HTTP or `postMessage` unchanged. Every mutating method runs in exactly one `UnitOfWork`.

---

## 5. Domain model

```ts
type Mark = 'correct' | 'present' | 'absent';
type Mode = 'daily' | 'practice';

interface Game {
  id: string;              // daily: `daily-2026-11-23`; practice: random UUID
  mode: Mode;
  date?: LocalDate;        // daily only, `YYYY-MM-DD` in the player's time zone
  number?: number;         // daily only: puzzle number
  solution: string;        // game spelling (§6)
  guesses: string[];
  hard: boolean;           // fixed by the first guess
  state: 'playing' | 'won' | 'lost';
  startedAt: Timestamp; finishedAt?: Timestamp;
}

interface Settings {
  uiLanguage: 'device' | 'en' | 'de';  theme: 'friendly' | 'device' | 'light' | 'dark';  // device/light/dark = paper
  hardMode: boolean;  highContrast: boolean;  seenHelp: boolean;  installHintDismissed: boolean;
}
```

Marks are never stored; they are recomputed from `guesses` and `solution`.

---

## 6. Word list

Built by `tools/build-words/build.mjs` (`npm run words`) into `packages/words/src/words-de.json`, which is committed.

**Sources**
- **igerman98 / `de_DE_frami`** Hunspell dictionary (LibreOffice dictionaries repository), GPL-2.0-or-later — which words exist, which are lemmas, and their inflected forms via the affix rules.
- **FrequencyWords** (OpenSubtitles 2018, German 50k list), CC-BY-SA-4.0 — how common a word is.

**Rules**
1. *Game spelling*: lower case, `ß → ss`, only `a–z ä ö ü`; length 5 after conversion.
2. *Allowed guesses*: every five-letter form the dictionary's prefix/suffix rules produce (entries flagged only-in-compound or forbidden are skipped), plus every five-letter word of the frequency list (it supplies forms the affix rules can't build, e.g. umlaut plurals like *bäume*).
3. *Solutions*: dictionary lemmas with frequency rank ≤ 25,000, excluding entries that need an affix (`h`), strong past forms listed as their own entry (`Z`: *ankam*, *wurde*), all-caps acronyms, and capitalised entries without the compound flag `m` (in igerman98 these are mostly names: *Jacob/S*, *Miami*). A hand-kept `tools/build-words/exclude.txt` removes the rest: slurs and vulgar words, places and names, English words, plurals and conjugated forms. Excluded words remain valid guesses.
4. *Order*: solutions are sorted, then shuffled with a fixed seed (mulberry32, `0x5707`). **Once released, never reorder**: append new solutions at the end and only remove words by replacing them in place, otherwise past and future daily words change.

Current pack: 986 solutions (enough for 2.7 years of daily words), 8,668 accepted words.

---

## 7. Logic in detail

### 7.1 Evaluating a guess (A3)
1. Pass 1: each letter equal to the solution's letter at the same position is `correct`; every other solution letter goes into a count of unmatched letters.
2. Pass 2, left to right: a non-correct guess letter is `present` if the count for that letter is above zero (then decrement), else `absent`.

So *ESSEN* against *ESELS* gives `correct correct present present absent`: the second S finds the unmatched S at the end, and the E finds the unmatched E in the middle.

### 7.2 Hard mode (A10)
For every earlier guess: each `correct` letter must be at the same position in the new guess (reported as *Buchstabe n muss X sein*), and each letter must occur at least as often as it was marked `correct` or `present` in that guess (*Das Wort muss X enthalten*, or *n× X*). The first violation found is reported.

### 7.3 Daily number
`dayNumber(date) = days since 2026-11-23 + 1` (computed on UTC midnights of the calendar dates, so daylight-saving changes don't matter; dates before the epoch map to 1). The epoch never changes.

### 7.4 Statistics and streaks (B1)
Computed from all finished games of a mode. Daily games are ordered by date; a win continues the streak if the previous game was a win on the previous date. The current streak is the run ending at the last game, set to 0 when that game is a loss or more than one day before today. Practice games are ordered by `finishedAt`; consecutive wins form the streak. The distribution counts wins by number of guesses.

### 7.5 Resume (A7)
Every guess is written before the UI animates it. On start the app loads today's daily game (creating it if needed); in practice mode it loads the game referenced by `meta.currentPractice`. The letters of an unsent guess are not stored.

### 7.6 Backup (C3)
`BackupV1 = { format: 'wortl-backup', version: 1, exportedAt, games, meta }` where `meta` holds `settings` and `currentPractice`. Import checks the format, then clears and refills both tables in one transaction. On phones the file goes through the share sheet (*In Dateien sichern*), elsewhere it downloads.

### 7.7 Path to a backend
- Implement `storage-http` with the same repository interfaces, or expose the `WortlApp` facade over REST/JSON.
- Daily game IDs are deterministic (`daily-<date>`), practice IDs are UUIDs, timestamps ISO-8601 UTC → straightforward last-writer-wins sync per game.
- A server-side daily word would replace `dailySolution` behind the `WordList` port; to keep solutions secret the server would then evaluate guesses.

---

## 8. UI design

Mobile-first, one-hand use, keyboard in the thumb zone. Respects `env(safe-area-inset-*)`. Its own look, deliberately unlike other word games:

- **Friendly** (default): soft lavender background with a warm glow at the top, white tiles with large radii, a rounded title font; violet (*right place*), peach with a corner dot (*wrong place*), blue-grey (*not in the word*).
- **Paper** (light, dark, or following the device): warm paper background, serif title; teal, amber with a corner dot, slate.

Themes are sets of CSS custom properties on `:root`, selected by `data-theme`; high contrast overrides the hint colours on top of either theme.

### 8.1 Screens

```
┌─────────────────────────────┐
│ (?)        Wortl       ▮▮ ⚙ │
│    [ Tageswort #12 | Übung ]│  ↻ new word (practice only)
│                             │
│      ┌─┐┌─┐┌─┐┌─┐┌─┐        │
│      │S││T││E││I││N│        │  6 × 5 board, sized to the free space
│      └─┘└─┘└─┘└─┘└─┘        │  (container query units)
│           …                 │
│                             │
│   Das Wort war WODKA        │  after the game: Statistik / Übung buttons
│ Q W E R T Z U I O P Ü       │
│ A S D F G H J K L Ö Ä       │
│ EINGABE Y X C V B N M ⌫     │
└─────────────────────────────┘
```

Sheets (native `<dialog>`, sliding up from the bottom): *So geht's* (rules with examples), *Statistik* (numbers, distribution, share, countdown / new word), *Einstellungen* (hard mode, high contrast, theme, app language, backup, about).

**Animations**: letter pop on typing, row shake on rejection, tiles flip one after another (260 ms apart) on reveal, a bounce of the winning row, confetti (canvas, ~2 s). All off with `prefers-reduced-motion`.

### 8.2 Details on demand
Settings that are hard to guess from their name (hard mode, high-contrast colours) have a small (i) after the name. A tap shows two or three sentences below the setting; another tap hides them. The (i) never toggles the setting.

### 8.3 App language
English and German (`apps/pwa/src/lib/i18n`). Settings › App language: *Wie das Gerät* (default; German when the device's first language is German, else English), *English*, *Deutsch*.

- Texts are keyed by their English wording: `t('Not in the word list')`, `t('Letter {n} must be {letter}', { n, letter })`. Texts used indirectly are marked with `msg('…')`. A missing German text shows the English one.
- German lives in `i18n/de/index.ts`; informal *du*. A unit test fails for any `t()`/`msg()` text without German, for German that loses a `{placeholder}`, and for German texts nothing uses.
- Numbers and percentages follow the app language (`fmt`, `pct`).

---

## 9. iOS-specific notes

- Manifest `display: "standalone"`, `apple-touch-icon`, `apple-mobile-web-app-status-bar-style: black-translucent`, `viewport-fit=cover`; the layout pads by the safe-area insets.
- `overscroll-behavior: none` prevents rubber-banding; `touch-action: manipulation` on the keyboard prevents double-tap zoom.
- Storage: `navigator.storage.persist()` is requested where supported; storage can still be lost → backup export (C3).
- Haptics: Android via `navigator.vibrate` on a rejected guess; iOS Safari doesn't support it, the shake carries the effect.
- Service worker precaches the app shell including the word pack; updates install automatically (`registerType: 'autoUpdate'`).
- Data entered in a Safari tab doesn't carry over to the installed app → the install hint appears on first visit.

---

## 10. Project layout

```
/
├─ apps/pwa/                 Svelte UI, service worker, manifest, e2e tests
├─ packages/core/            domain, services, ports, createApp(), in-memory ports
├─ packages/storage-idb/     Dexie schema + repository implementations
├─ packages/words/           words-de.json (generated) + WordList implementation
├─ tools/build-words/        builds words-de.json from public sources; exclude.txt
├─ README.md
└─ LICENSES.md               third-party data and code attributions
```

### IndexedDB schema (Dexie, v1)

```ts
db.version(1).stores({
  games: 'id, mode',
  meta:  'key',          // settings, currentPractice
});
```

### Commands

```sh
npm install
npm run dev          # Vite dev server (port 5317, also on the LAN for phone testing)
npm test             # Vitest: core, words, storage, i18n
npm run typecheck    # tsc for packages (core without DOM) + svelte-check
npm run lint         # ESLint incl. the architecture rules of §4
npm run build        # production build with service worker → apps/pwa/dist
npm run test:e2e     # Playwright (builds and serves on port 4317)
npm run words        # rebuild the word pack (downloads sources into tools/build-words/.cache)
npm run icons -w apps/pwa   # regenerate PNG icons from public/logo.svg
```

`dist/` is a static site; deploy it to any HTTPS host (a sub-path works, `base` is relative).

---

## 11. Testing

- **core**: Vitest unit tests with in-memory ports (`core/src/testing`).
- **Evaluation**: repeated letters in guess and solution, umlauts vs. plain vowels, the ESSEN/ESELS case of §7.1.
- **Hard mode**: position rule, count rule for repeated letters, a valid follow-up.
- **Daily**: numbering from the epoch, across a DST change, before the epoch; cycling through the list.
- **Stats**: streaks broken by a loss and by a missed day; current streak on the next day and the day after; unfinished games ignored.
- **App**: resume after "restart" (new `createApp` over the same ports), day change, rejected guesses don't use a try, normalising case and ß, win/loss, hard mode fixed at the first guess, practice never equals today's word, abandoning counts as lost, share text, backup round-trip and rejection of foreign files.
- **Storage**: Dexie adapter on `fake-indexeddb`, including rollback of a failed unit of work.
- **Words**: answers unique, five letters in game spelling, all allowed; common inflected forms allowed.
- **i18n**: every text has German with the same placeholders, no unused German.
- **UI**: Playwright on an iPhone profile (WebKit) and a Pixel profile (Chromium): invalid word, guess, resume after reload, win → statistics; physical keyboard, practice mode.

---

## 12. Milestones

1. **M1 Core** ✅ domain, services, ports, in-memory fakes, unit tests.
2. **M2 Data** ✅ word-pack builder, words package, IndexedDB adapter.
3. **M3 Play** ✅ board, keyboard, animations, daily and practice modes, resume.
4. **M4 Polish** ✅ statistics, share, settings, i18n, themes, high contrast, backup, install hint, icons.
5. **M5 Devices**: test on a real iPhone (current and one older iOS) and a mid-range Android; deploy.

---

## 13. Open questions

- The solution list is curated by rules plus a hand-kept exclusion list. A manual pass over all 986 words before the first public release would catch remaining oddities (rare words, regional forms).
- igerman98 is GPL; shipping the derived list in the app arguably makes the word pack GPL. Fine for a personal project; for anything else consider a permissively licensed source (e.g. Wiktionary/Wiktextract, CC-BY-SA).
- Should the daily word follow Europe/Berlin instead of the device's time zone, so players abroad share the same number?
- Later improvements assessed but not included: a gentle backup reminder, sharing an image instead of text, a "word of yesterday" link to a dictionary.
