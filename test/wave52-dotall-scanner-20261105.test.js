// Host-only source grammar flag isolation; no compiler guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('dotAll belongs only to its own rule; multiline anchors remain intact', () => {
  const language = createRegexLanguage({ id: 'wave52-flags', tokens: [
    { kind: 'strict', pattern: /A.B/ },
    { kind: 'dotall', pattern: /A.B/s },
    { kind: 'line', pattern: /^C/m },
  ]});
  assert.deepEqual(language.tokenize('A\nB\nC'), [
    { kind: 'dotall', value: 'A\nB' },
    { kind: 'plain', value: '\n' },
    { kind: 'line', value: 'C' },
  ]);
  assert.deepEqual(language.tokenize('A-B\nC'), [
    { kind: 'strict', value: 'A-B' },
    { kind: 'plain', value: '\n' },
    { kind: 'line', value: 'C' },
  ]);
  assert.equal(language.tokenize('A\nB\nC').map(token => token.value).join(''), 'A\nB\nC');
});
