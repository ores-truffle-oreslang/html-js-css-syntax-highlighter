// Host scanner invariants only; no native AttoLang compiler execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('positive-width tokens conserve scalar gaps and CRLF around zero-width probes', () => {
  const grammar = createRegexLanguage({
    id: 'wave58-scalar-gap',
    tokens: [
      { kind: 'zero', pattern: /(?=😀)/u },
      { kind: 'emoji', pattern: /😀/u },
      { kind: 'letter', pattern: /A/u },
    ],
  });
  const source = 'μ\r\n😀 !A\t😀';
  const expected = [
    { kind: 'plain', value: 'μ\r\n' },
    { kind: 'emoji', value: '😀' },
    { kind: 'plain', value: ' !' },
    { kind: 'letter', value: 'A' },
    { kind: 'plain', value: '\t' },
    { kind: 'emoji', value: '😀' },
  ];
  for (let i = 0; i < 3; ++i) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
  }
});
