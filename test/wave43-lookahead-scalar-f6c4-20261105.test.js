// Source-owned host regression: zero-width regex probes must make scalar progress.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('zero-width lookaheads cannot steal following astral Unicode token spans', () => {
  const language = createRegexLanguage({id: 'wave42-unicode', tokens: [
    {kind: 'zero-width', pattern: /(?=a)/u},
    {kind: 'emoji', pattern: /\u{1F4A1}/u},
    {kind: 'letter', pattern: /a/u},
  ]});
  const input = '💡a💡a';
  const expected = [
    {kind: 'emoji', value: '💡'},
    {kind: 'letter', value: 'a'},
    {kind: 'emoji', value: '💡'},
    {kind: 'letter', value: 'a'},
  ];
  assert.deepEqual(language.tokenize(input), expected);
  assert.deepEqual(language.tokenize(input), expected);
  assert.equal(language.tokenize(input).map(x => x.value).join(''), input);
});

test('an entirely zero-width grammar returns the complete original text', () => {
  const language = createRegexLanguage({id: 'wave42-zeros-only', tokens: [
    {kind: 'never-consumed', pattern: /(?=.)/u},
  ]});
  const input = '💡a';
  assert.deepEqual(language.tokenize(input), [{kind: 'plain', value: input}]);
});
