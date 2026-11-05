// Host-only rule-ownership regression; not guest/compiler execution evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('constructing and executing a grammar does not mutate caller RegExp lastIndex', () => {
  const keyword = /foo/gi;
  const number = /[0-9]+/g;
  keyword.lastIndex = 3;
  number.lastIndex = 5;
  const grammar = createRegexLanguage({id: 'wave61-regexp-cursor', tokens: [
    {kind: 'keyword', pattern: keyword},
    {kind: 'number', pattern: number},
  ]});
  const expected = [
    {kind: 'keyword', value: 'FOO'},
    {kind: 'plain', value: ' '},
    {kind: 'number', value: '7'},
    {kind: 'plain', value: ' '},
    {kind: 'keyword', value: 'foo'},
  ];
  for (let pass = 0; pass < 3; pass++) {
    assert.deepEqual(grammar.tokenize('FOO 7 foo'), expected);
    assert.equal(keyword.lastIndex, 3);
    assert.equal(number.lastIndex, 5);
  }
});

test('per-rule case folding never changes caller RegExp flags', () => {
  const folded = /abc/i;
  const exact = /DEF/;
  const grammar = createRegexLanguage({id: 'wave61-rule-flags', tokens: [
    {kind: 'folded', pattern: folded},
    {kind: 'exact', pattern: exact},
  ]});
  assert.deepEqual(grammar.tokenize('Abc def DEF'), [
    {kind: 'folded', value: 'Abc'},
    {kind: 'plain', value: ' def '},
    {kind: 'exact', value: 'DEF'},
  ]);
  assert.equal(folded.flags, 'i');
  assert.equal(exact.flags, '');
});
