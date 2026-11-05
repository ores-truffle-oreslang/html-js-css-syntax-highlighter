// Host lexer regression: per-rule flags must not bleed across alternatives.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('string rules stay case-sensitive while regex case/dotall flags remain local', () => {
  const grammar = createRegexLanguage({
    id: 'wave242-rule-local-flags',
    tokens: [
      { kind: 'literal', pattern: 'bar' },
      { kind: 'folded', pattern: /bar/i },
      { kind: 'multiline', pattern: /a.b/s },
    ],
  });
  const source = 'BAR bar a\nb';
  const expected = [
    { kind: 'folded', value: 'BAR' },
    { kind: 'plain', value: ' ' },
    { kind: 'literal', value: 'bar' },
    { kind: 'plain', value: ' ' },
    { kind: 'multiline', value: 'a\nb' },
  ];
  for (let pass = 0; pass < 3; pass++) {
    const result = grammar.tokenize(source);
    assert.deepEqual(result, expected);
    assert.equal(result.map(token => token.value).join(''), source);
  }
});
