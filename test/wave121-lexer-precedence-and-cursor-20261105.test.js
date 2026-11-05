// Source-owned tokenizer contract: precise token precedence and cursor reset.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('earlier rule wins equal-offset ties while later distinct ranges remain reachable', () => {
  const input = /if/gu;
  input.lastIndex = 2;
  const language = createRegexLanguage({
    id: 'wave121-precedence',
    tokens: [
      {kind: 'keyword', pattern: input},
      {kind: 'identifier', pattern: /[a-z]+/u},
      {kind: 'number', pattern: /[0-9]+/u},
    ],
  });
  const value = 'if ifx else 42 if';
  const expected = [
    {kind: 'keyword', value: 'if'}, {kind: 'plain', value: ' '},
    {kind: 'keyword', value: 'if'}, {kind: 'identifier', value: 'x'},
    {kind: 'plain', value: ' '}, {kind: 'identifier', value: 'else'},
    {kind: 'plain', value: ' '}, {kind: 'number', value: '42'},
    {kind: 'plain', value: ' '}, {kind: 'keyword', value: 'if'},
  ];
  assert.deepEqual(language.tokenize(value), expected);
  assert.deepEqual(language.tokenize(''), []);
  assert.deepEqual(language.tokenize(value), expected);
  assert.equal(input.lastIndex, 2, 'caller RegExp cursor must not be modified');
  assert.equal(expected.map(t => t.value).join(''), value);
});

test('repeated language instances do not bleed alternating scanner state', () => {
  const a = createRegexLanguage({id: 'wave121-a', tokens: [{kind: 'wide', pattern: /A.+B/s}]});
  const b = createRegexLanguage({id: 'wave121-b', tokens: [{kind: 'line', pattern: /A.+B/}]});
  const source = 'A\nB';
  assert.deepEqual(a.tokenize(source), [{kind: 'wide', value: source}]);
  assert.deepEqual(b.tokenize(source), [{kind: 'plain', value: source}]);
  assert.deepEqual(a.tokenize(source), [{kind: 'wide', value: source}]);
});
