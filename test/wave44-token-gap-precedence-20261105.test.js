// Host-only token-order and source-preservation regression; no guest compiler claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('first matching rule wins ties without dropping astral or newline gaps', () => {
  const grammar = createRegexLanguage({id: 'wave44-token-gap', tokens: [
    {kind: 'first', pattern: /foo/},
    {kind: 'second', pattern: /foo|bar/},
    {kind: 'number', pattern: /[0-9]+/},
  ]});
  const source = '💠foo...bar 007\n';
  const expected = [
    {kind: 'plain', value: '💠'},
    {kind: 'first', value: 'foo'},
    {kind: 'plain', value: '...'},
    {kind: 'second', value: 'bar'},
    {kind: 'plain', value: ' '},
    {kind: 'number', value: '007'},
    {kind: 'plain', value: '\n'},
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});

test('repeated tokenization resets per-rule regex state', () => {
  const grammar = createRegexLanguage({id: 'wave44-reset', tokens: [
    {kind: 'first', pattern: /foo/},
    {kind: 'second', pattern: /bar/},
  ]});
  for (const source of ['foobar', 'barfoo', 'foobar', 'barfoo']) {
    const result = grammar.tokenize(source);
    assert.deepEqual(result.map(token => token.value).join(''), source);
    assert.deepEqual(result.map(token => token.kind),
      source === 'foobar' ? ['first', 'second'] : ['second', 'first']);
  }
});
