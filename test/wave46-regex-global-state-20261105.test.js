import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('caller global regex cursor does not leak into compiled grammar or subsequent runs', () => {
  const callerPattern = /ab/gi;
  callerPattern.lastIndex = 77;
  const grammar = createRegexLanguage({
    id: 'wave46-global-regexp',
    tokens: [
      { kind: 'word', pattern: callerPattern },
      { kind: 'number', pattern: /[0-9]+/g },
    ],
  });
  const source = 'AB 12 ab';
  const expected = [
    { kind: 'word', value: 'AB' },
    { kind: 'plain', value: ' ' },
    { kind: 'number', value: '12' },
    { kind: 'plain', value: ' ' },
    { kind: 'word', value: 'ab' },
  ];
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.deepEqual(grammar.tokenize(source), expected);
    assert.deepEqual(grammar.tokenize('!'), [{ kind: 'plain', value: '!' }]);
  }
  assert.equal(callerPattern.lastIndex, 77);
});
