import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Host lexer contract only; this is not a compiler/parser execution proof.
test('mixed ignore-case, dotAll and unflagged rules keep independent cursors', () => {
  const language = createRegexLanguage({
    id: 'wave45-independent-regex-cursors',
    tokens: [
      { kind: 'case', pattern: /ember/i },
      { kind: 'multiline', pattern: /x.y/s },
      { kind: 'number', pattern: /[0-9]{2}/ },
    ],
  });
  const input = 'EMBeR x\ny 42 ember xay';
  const expected = [
    { kind: 'case', value: 'EMBeR' },
    { kind: 'plain', value: ' ' },
    { kind: 'multiline', value: 'x\ny' },
    { kind: 'plain', value: ' ' },
    { kind: 'number', value: '42' },
    { kind: 'plain', value: ' ' },
    { kind: 'case', value: 'ember' },
    { kind: 'plain', value: ' ' },
    { kind: 'multiline', value: 'xay' },
  ];
  assert.deepEqual(language.tokenize(input), expected);
  assert.deepEqual(language.tokenize(input), expected);
  assert.equal(expected.map(token => token.value).join(''), input);
});

test('longer earlier rule wins equal start offsets after a prior match', () => {
  const language = createRegexLanguage({
    id: 'wave45-equal-offset-rule-precedence',
    tokens: [
      { kind: 'compound', pattern: /foo-bar/ },
      { kind: 'simple', pattern: /foo/ },
    ],
  });
  assert.deepEqual(language.tokenize('foo foo-bar foo'), [
    { kind: 'simple', value: 'foo' },
    { kind: 'plain', value: ' ' },
    { kind: 'compound', value: 'foo-bar' },
    { kind: 'plain', value: ' ' },
    { kind: 'simple', value: 'foo' },
  ]);
});
