import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('mixed astral, CRLF, case rules replay without leaking RegExp cursors or caller mutation', () => {
  const word = /ab/gi;
  const astral = /🧪/gu;
  word.lastIndex = 11;
  astral.lastIndex = 9;
  const rules = [
    { kind: 'word', pattern: word },
    { kind: 'mark', pattern: astral },
    { kind: 'number', pattern: /[0-9]+/ }
  ];
  const grammar = createRegexLanguage({ id: 'gpt6-2319-lexical', tokens: rules });
  const source = 'x🧪ab 42\r\nAB+🧪';
  const expected = [
    { kind: 'plain', value: 'x' },
    { kind: 'mark', value: '🧪' },
    { kind: 'word', value: 'ab' },
    { kind: 'plain', value: ' ' },
    { kind: 'number', value: '42' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'word', value: 'AB' },
    { kind: 'plain', value: '+' },
    { kind: 'mark', value: '🧪' }
  ];
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const result = grammar.tokenize(source);
    assert.deepEqual(result, expected, 'tokenization must be deterministic at iteration ' + iteration);
    assert.equal(result.map(token => token.value).join(''), source);
    assert.equal(word.lastIndex, 11, 'must not change caller-owned global RegExp cursor');
    assert.equal(astral.lastIndex, 9, 'must not change caller-owned Unicode cursor');
  }
  rules[0].kind = 'untrusted-late-mutation';
  rules[1].pattern = /x/;
  rules.push({kind: 'replacement', pattern: /./});
  assert.deepEqual(grammar.tokenize(source), expected,
    'compiled grammar must use its construction-time rule snapshot');
});
