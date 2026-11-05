// Host-side rule compilation regression; not backend lexical certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('string rules stay case-sensitive next to case-folded regex rules', () => {
  const lang = createRegexLanguage({
    id: 'host-mixed-string-regex',
    tokens: [
      { kind: 'exact', pattern: 'ABC' },
      { kind: 'folded', pattern: /abc/i },
    ],
  });
  const source = 'abc ABC abC';
  const expected = [
    { kind: 'folded', value: 'abc' },
    { kind: 'plain', value: ' ' },
    { kind: 'exact', value: 'ABC' },
    { kind: 'plain', value: ' ' },
    { kind: 'folded', value: 'abC' },
  ];
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(lang.tokenize(source), expected);
  }
  assert.equal(lang.tokenize(source).map(token => token.value).join(''), source);
});
