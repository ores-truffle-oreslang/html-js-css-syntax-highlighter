import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Host-only UTF-16 boundary regression; this is not guest compiler evidence.
const language = createRegexLanguage({
  id: 'wave46-utf16',
  tokens: [
    { kind: 'upper', pattern: /[A-Z]+/ },
    { kind: 'digits', pattern: /[0-9]+/ },
  ],
});

test('tokenization preserves every original code unit around astral and lone-surrogate gaps', () => {
  const source = '🚀AB\u0000Ω42\nA\uD800Z';
  const tokens = language.tokenize(source);
  assert.equal(tokens.map(token => token.value).join(''), source);
  assert.deepEqual(tokens.filter(token => token.kind !== 'plain'), [
    { kind: 'upper', value: 'AB' },
    { kind: 'digits', value: '42' },
    { kind: 'upper', value: 'A' },
    { kind: 'upper', value: 'Z' },
  ]);
});

test('global regex lastIndex does not bleed between different source strings', () => {
  const first = 'ABC\n12';
  const second = '🚀Z9\u0000Q';
  for (const source of [first, second, first, second]) {
    const tokens = language.tokenize(source);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.equal(tokens.every(token => token.value.length > 0), true);
  }
});
