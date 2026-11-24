import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/dev-dist/**', '**/node_modules/**', '**/*.svelte', 'tools/build-words/.cache/**'] },
  ...tseslint.configs.recommended,
  {
    // README §4 rule 1: core imports nothing from the app or any adapter.
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@wortl/storage-idb', '@wortl/words', '**/apps/**', 'dexie', 'svelte*'] }],
      'no-restricted-globals': ['error', 'window', 'document', 'indexedDB', 'localStorage', 'navigator'],
      'no-restricted-properties': ['error',
        { object: 'Date', property: 'now', message: 'Use the injected Clock.' },
        { object: 'Math', property: 'random', message: 'Use the injected Random.' }],
    },
  },
);
