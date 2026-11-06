// Caller-owned RegExp flag/state must not leak across independently compiled rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('dotAll and ignoreCase belong to their own regex rule across Unicode replays', () => {
  const multiline = /a.b/is;
  const lowercase = /foo/;
  const caseInsensitive = /BAR/i;
  multiline.lastIndex = 9;
  lowercase.lastIndex = 7;
  caseInsensitive.lastIndex = 5;
  const grammar = createRegexLanguage({
    id: 'wave2140b-per-rule-flags',
    tokens: [
      {kind: 'dotall', pattern: multiline},
      {kind: 'lower', pattern: lowercase},
      {kind: 'ci', pattern: caseInsensitive},
    ],
  });
  const source = 'A\nb foo FOO BAR bar 🙂';
  const expected = [
    {kind: 'dotall', value: 'A\nb'},
    {kind: 'plain', value: ' '},
    {kind: 'lower', value: 'foo'},
    {kind: 'plain', value: ' FOO '},
    {kind: 'ci', value: 'BAR'},
    {kind: 'plain', value: ' '},
    {kind: 'ci', value: 'bar'},
    {kind: 'plain', value: ' 🙂'},
  ];
  for (let i = 0; i < 12; i++) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.equal(multiline.lastIndex, 9);
    assert.equal(lowercase.lastIndex, 7);
    assert.equal(caseInsensitive.lastIndex, 5);
  }
});
