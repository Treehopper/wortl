import { describe, expect, it } from 'vitest';
import { evaluate, hardModeViolation, keyboardMarks } from '../src/index.js';

const m = (s: string) => [...s].map((c) => ({ c: 'correct', p: 'present', a: 'absent' })[c]);

describe('evaluate (§7.1)', () => {
  it.each([
    ['katze', 'katze', 'ccccc'],
    ['tasse', 'katze', 'pcaac'], // t is present: the solution's t sits at position 3
    ['essen', 'esels', 'ccppa'], // second s present once; n absent
    ['aaaaa', 'kanal', 'acaca'], // only the two a's in place count
    ['lager', 'kanal', 'pcaaa'],
    ['süden', 'suppe', 'caapa'],
    ['bäume', 'baume', 'caccc'], // ä and a are different letters
    ['ebene', 'leber', 'pppaa'], // third e absent: the solution has two
  ])('%s against %s', (guess, solution, marks) => {
    expect(evaluate(guess, solution)).toEqual(m(marks));
  });
});

describe('keyboardMarks', () => {
  it('keeps the best mark per letter', () => {
    const keys = keyboardMarks(['tasse', 'katze'], 'katze');
    expect(keys.t).toBe('correct'); // present in the first guess, correct in the second;
    expect(keys.s).toBe('absent');
    expect(keys.k).toBe('correct');
  });
});

describe('hard mode (A10)', () => {
  it('requires correct letters in place', () => {
    expect(hardModeViolation(['tasse'], 'katze', 'tisch')).toEqual({ kind: 'position', letter: 'a', position: 2 });
  });
  it('requires present letters as often as revealed', () => {
    expect(hardModeViolation(['essen'], 'esels', 'esche')).toEqual({ kind: 'missing', letter: 's', count: 2 });
    expect(hardModeViolation(['essen'], 'esels', 'esels')).toBeUndefined();
  });
  it('accepts a guess that uses all hints', () => {
    expect(hardModeViolation(['tasse'], 'katze', 'katze')).toBeUndefined();
  });
});
