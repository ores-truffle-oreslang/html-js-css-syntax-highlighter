import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Host lexer regression only. The v-flag's set intersection must survive
// grammar compilation; zero-width rules must not emit or split Unicode scalars.
test('UnicodeSets intersection, zero-width matches and astral scalars conserve source', (t) => {
  let greekSet;
  try {
    greekSet = new RegExp('[\\p{Script=Greek}&&\\p{Letter}]+', 'v');
  } catch {
    t.skip('Node runtime does not support UnicodeSets v');
    return;
  }
  greekSet.lastIndex = 2;
  const noop = /(?=.)/u;
  const digits = /\p{Nd}+/u;
  const language = createRegexLanguage({
    id: 'greek-v-regression',
    tokens: [
      { kind: 'greek', pattern: greekSet },
      { kind: 'digit', pattern: digits },
      { kind: 'never', pattern: noop },
    ],
  });

  const input = '😀αβ\r\n7𐐀γ';
  const expected = [
    { kind: 'plain', value: '😀' },
    { kind: 'greek', value: 'αβ' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'digit', value: '7' },
    { kind: 'plain', value: '𐐀' },
    { kind: 'greek', value: 'γ' },
  ];
  for (let i = 0; i < 30; i++) {
    const actual = language.tokenize(i % 2 === 0 ? input : input + '😀');
    assert.deepEqual(actual, i % 2 === 0 ? expected : [...expected, { kind: 'plain', value: '😀' }]);
    assert.ok(actual.every((token) => token.value.length > 0));
    assert.equal(actual.map((token) => token.value).join(''), i % 2 === 0 ? input : input + '😀');
  }
  assert.equal(greekSet.lastIndex, 2, 'compiling and scanning must not touch the caller regex cursor');
  assert.equal(noop.lastIndex, 0);
  assert.equal(digits.lastIndex, 0);
});
