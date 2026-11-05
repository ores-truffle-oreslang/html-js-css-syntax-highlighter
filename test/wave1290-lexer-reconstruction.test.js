import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('mixed CRLF, astral and zero-width rules always reconstruct original source', () => {
  const inputPattern = /a/gy;
  const language = createRegexLanguage({
    id: 'wave1290-reconstruct',
    tokens: [
      { kind: 'astral', pattern: /😀/gu },
      { kind: 'ascii', pattern: inputPattern },
      { kind: 'lookahead', pattern: /(?=b)/gu },
      { kind: 'bee', pattern: /b/gu },
      { kind: 'line', pattern: /\r\n/gu },
    ],
  });
  const alphabet = ['a', 'b', '😀', '\r\n', '&'];
  let cases = [''];
  const all = [''];
  for (let width = 1; width <= 4; width++) {
    cases = cases.flatMap(prefix => alphabet.map(unit => prefix + unit));
    all.push(...cases);
  }
  assert.equal(all.length, 781);
  for (const input of all) {
    inputPattern.lastIndex = 99;
    const first = language.tokenize(input);
    assert.equal(first.map(token => token.value).join(''), input, JSON.stringify(input));
    assert.ok(first.every(token => token.value.length > 0), JSON.stringify(input));
    inputPattern.lastIndex = 0;
    assert.deepEqual(language.tokenize(input), first, JSON.stringify(input));
  }
  assert.equal(inputPattern.lastIndex, 0, 'caller-owned RegExp cursor is never mutated');
});
