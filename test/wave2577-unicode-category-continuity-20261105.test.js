// Source-owned Unicode lexer contract; not a compiler-backed guest claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('Unicode letter and number classes retain combining marks, CRLF, and caller cursor', () => {
  const callerPattern = /\p{Letter}+/uy;
  callerPattern.lastIndex = 3;
  const grammar = createRegexLanguage({
    id: 'wave2577-unicode',
    tokens: [
      { kind: 'letter', pattern: callerPattern },
      { kind: 'number', pattern: /\p{Number}+/u },
    ],
  });
  const input = '🚀A\u0301Ω\r\n𝒜3_猫\n';
  const expected = [
    { kind: 'plain', value: '🚀' },
    { kind: 'letter', value: 'A' },
    { kind: 'plain', value: '\u0301' },
    { kind: 'letter', value: 'Ω' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'letter', value: '𝒜' },
    { kind: 'number', value: '3' },
    { kind: 'plain', value: '_' },
    { kind: 'letter', value: '猫' },
    { kind: 'plain', value: '\n' },
  ];
  for (let i = 0; i < 8; i++) {
    const actual = grammar.tokenize(input);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), input);
    assert.equal(callerPattern.lastIndex, 3);
  }
});
