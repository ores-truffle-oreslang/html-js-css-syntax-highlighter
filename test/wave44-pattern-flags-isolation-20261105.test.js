import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('regex rule flags remain local and cannot change a sibling rule', () => {
  const grammar = createRegexLanguage({
    id: 'wave44-flags',
    tokens: [
      { kind: 'uppercase', pattern: /A+/ },
      { kind: 'insensitive-b', pattern: /b+/i },
      { kind: 'dotall', pattern: /c.d/s },
    ],
  });
  const source = 'AA aa BB bb c\nd cXd';
  const expected = [
    { kind: 'uppercase', value: 'AA' },
    { kind: 'plain', value: ' aa ' },
    { kind: 'insensitive-b', value: 'BB' },
    { kind: 'plain', value: ' ' },
    { kind: 'insensitive-b', value: 'bb' },
    { kind: 'plain', value: ' ' },
    { kind: 'dotall', value: 'c\nd' },
    { kind: 'plain', value: ' ' },
    { kind: 'dotall', value: 'cXd' },
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});
