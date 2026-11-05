// Host-level lexer semantics only; no compiler guest/AOT evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('caller global and sticky regex cursor never governs a compiled lexer', () => {
  const caller = /ab/gy;
  caller.lastIndex = 41;
  const language = createRegexLanguage({
    id: 'wave610-sticky',
    tokens: [{kind: 'pair', pattern: caller}],
  });
  const source = 'zab ab';
  const expected = [
    {kind: 'plain', value: 'z'},
    {kind: 'pair', value: 'ab'},
    {kind: 'plain', value: ' '},
    {kind: 'pair', value: 'ab'},
  ];
  assert.deepEqual(language.tokenize(source), expected);
  assert.deepEqual(language.tokenize(source), expected);
  assert.equal(caller.lastIndex, 41, 'tokenization must not mutate the owner RegExp');
  assert.equal(language.tokenize(source).map(t => t.value).join(''), source);
  caller.lastIndex = 0;
  assert.deepEqual(language.tokenize(source), expected);
});
