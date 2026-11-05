// Host-only Unicode lexer round-trip: adjacent astral and BMP tokens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('adjacent astral emoji and BMP Greek tokens preserve exact scalar boundaries', () => {
  const grammar = createRegexLanguage({ id: 'wave45-unicode-adjacency', tokens: [
    { kind: 'emoji', pattern: /🦊/u },
    { kind: 'greek', pattern: /[α-ω]+/u },
    { kind: 'bang', pattern: /!/ },
  ] });
  const source = '🦊αβ!🦊';
  const tokens = grammar.tokenize(source);
  assert.deepEqual(tokens, [
    { kind: 'emoji', value: '🦊' },
    { kind: 'greek', value: 'αβ' },
    { kind: 'bang', value: '!' },
    { kind: 'emoji', value: '🦊' },
  ]);
  assert.equal(tokens.map(token => token.value).join(''), source);
});
