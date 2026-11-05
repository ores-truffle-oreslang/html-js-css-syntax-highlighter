// Host-only scanner regression: regex flags belong only to their own token rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('dotAll ignoreCase regex cannot make a sibling rule case-insensitive', () => {
  const grammar = createRegexLanguage({ id: 'wave80-rule-flags', tokens: [
    { kind: 'multiline', pattern: /alpha.beta/si },
    { kind: 'lowercase', pattern: /case/ },
  ] });
  const source = 'ALPHA\nBETA CASE case';
  const expected = [
    { kind: 'multiline', value: 'ALPHA\nBETA' },
    { kind: 'plain', value: ' CASE ' },
    { kind: 'lowercase', value: 'case' },
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});
