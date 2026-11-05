import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Host-only cursor isolation: caller RegExp instances do not own grammar state.
test('mutating original RegExp.lastIndex cannot affect the compiled language', () => {
  const original = /a+/gu;
  original.lastIndex = 99;
  const grammar = createRegexLanguage({
    id: 'wave46-cursor',
    tokens: [{kind: 'mark', pattern: original}, {kind: 'digits', pattern: /[0-9]+/u}],
  });
  const expected = [
    {kind: 'mark', value: 'a'},
    {kind: 'digits', value: '2'},
    {kind: 'mark', value: 'aa'},
    {kind: 'digits', value: '3'},
  ];
  assert.deepEqual(grammar.tokenize('a2aa3'), expected);
  assert.equal(original.lastIndex, 99);
  original.lastIndex = 1;
  assert.deepEqual(grammar.tokenize('a2aa3'), expected);
  assert.equal(original.lastIndex, 1);
});

test('interleaved tokenization never carries cursor state between source documents', () => {
  const pattern = /x+/giu;
  const first = createRegexLanguage({id: 'wave46-first', tokens: [{kind: 'hit', pattern}]});
  const second = createRegexLanguage({id: 'wave46-second', tokens: [{kind: 'hit', pattern}]});
  assert.deepEqual(first.tokenize('xx'), [{kind: 'hit', value: 'xx'}]);
  assert.deepEqual(second.tokenize('aXb'), [
    {kind: 'plain', value: 'a'}, {kind: 'hit', value: 'X'}, {kind: 'plain', value: 'b'},
  ]);
  assert.deepEqual(first.tokenize(''), []);
  assert.deepEqual(first.tokenize('xx'), [{kind: 'hit', value: 'xx'}]);
  assert.equal(pattern.lastIndex, 0);
});
