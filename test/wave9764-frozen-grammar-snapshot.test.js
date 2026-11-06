import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

// Source-owned lexer/renderer ownership contract; not guest compiler evidence.
test('frozen caller regexes, rules and aliases remain immutable across scans', () => {
  const emoji = /🥑/u;
  emoji.lastIndex = 5;
  Object.freeze(emoji);
  const number = /\p{Nd}+/u;
  Object.freeze(number);
  const aliases = Object.freeze(['wave9764-alias']);
  const rules = Object.freeze([
    Object.freeze({kind: 'emoji', pattern: emoji}),
    Object.freeze({kind: 'number', pattern: number}),
  ]);
  const grammar = createRegexLanguage({id: 'wave9764-frozen', aliases, tokens: rules});
  assert.notStrictEqual(grammar.aliases, aliases);
  const highlighter = new SyntaxHighlighter({languages: [grammar]});
  const input = '🥑<٣&🥑';
  const expected = [
    {kind: 'emoji', value: '🥑'},
    {kind: 'plain', value: '<'},
    {kind: 'number', value: '٣'},
    {kind: 'plain', value: '&'},
    {kind: 'emoji', value: '🥑'},
  ];
  for (let i = 0; i < 30; i++) {
    const tokens = highlighter.tokenize(input, 'wave9764-alias');
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(t => t.value).join(''), input);
    assert.equal(highlighter.highlight(input, 'wave9764-frozen'),
      '<span class="tok-emoji">🥑</span>&lt;<span class="tok-number">٣</span>&amp;<span class="tok-emoji">🥑</span>');
    assert.equal(emoji.lastIndex, 5);
    assert.equal(number.lastIndex, 0);
  }
  assert.deepEqual(aliases, ['wave9764-alias']);
  assert.equal(rules[0].pattern, emoji);
});
