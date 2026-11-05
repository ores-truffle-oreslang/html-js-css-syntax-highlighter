// Host-only lexer snapshot regression; no compiler or guest execution claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('registered token rules keep their compiled patterns and category when caller mutates inputs', () => {
  const word = {kind: 'word', pattern: /foo/i};
  const punctuation = {kind: 'punctuation', pattern: /,/};
  const grammar = createRegexLanguage({id: 'wave41-snapshot', tokens: [word, punctuation]});
  const source = 'FOO, foo';
  const expected = [
    {kind: 'word', value: 'FOO'},
    {kind: 'punctuation', value: ','},
    {kind: 'plain', value: ' '},
    {kind: 'word', value: 'foo'},
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  word.kind = 'untrusted-after-registration';
  word.pattern = /not-a-word/;
  punctuation.kind = 'untrusted-punctuation';
  punctuation.pattern = /never/;
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});

test('case-insensitive rule flags do not leak to later case-sensitive rules', () => {
  const grammar = createRegexLanguage({id: 'wave41-flag-isolation', tokens: [
    {kind: 'mixed', pattern: /foo/i},
    {kind: 'upper', pattern: /BAR/},
  ]});
  const source = 'Foo bar BAR';
  assert.deepEqual(grammar.tokenize(source), [
    {kind: 'mixed', value: 'Foo'},
    {kind: 'plain', value: ' bar '},
    {kind: 'upper', value: 'BAR'},
  ]);
});
