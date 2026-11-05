// Source-owned host regression: independently compiled regex flags and state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('rule-specific ignoreCase does not change exact-case precedence', () => {
  const original = /hello/i;
  original.lastIndex = 27;
  const language = createRegexLanguage({
    id: 'wave45-rule-flags',
    tokens: [
      { kind: 'exact', pattern: /HELLO/ },
      { kind: 'folded', pattern: original },
      { kind: 'word', pattern: /[A-Za-z]+/ },
    ],
  });
  const input = 'hello HELLO HeLLo';
  const expected = [
    { kind: 'folded', value: 'hello' },
    { kind: 'plain', value: ' ' },
    { kind: 'exact', value: 'HELLO' },
    { kind: 'plain', value: ' ' },
    { kind: 'folded', value: 'HeLLo' },
  ];
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const actual = language.tokenize(input);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), input);
  }
  // Compiling the language must not mutate the caller's regex.
  assert.equal(original.lastIndex, 27);
});

test('different language instances cannot share regex lastIndex', () => {
  const shared = /ok/gi;
  const a = createRegexLanguage({ id: 'wave45-first', tokens: [{ kind: 'a', pattern: shared }] });
  const b = createRegexLanguage({ id: 'wave45-second', tokens: [{ kind: 'b', pattern: shared }] });
  assert.deepEqual(a.tokenize('OK ok'), [
    { kind: 'a', value: 'OK' },
    { kind: 'plain', value: ' ' },
    { kind: 'a', value: 'ok' },
  ]);
  assert.deepEqual(b.tokenize('ok OK'), [
    { kind: 'b', value: 'ok' },
    { kind: 'plain', value: ' ' },
    { kind: 'b', value: 'OK' },
  ]);
  assert.deepEqual(a.tokenize('OK'), [{ kind: 'a', value: 'OK' }]);
  assert.equal(shared.lastIndex, 0);
});
