import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('repeated calls reset matching state without losing astral source scalars', () => {
  const language = createRegexLanguage({
    id: 'wave44-regex-cursors',
    tokens: [
      { kind: 'pair', pattern: /ab/g },
      { kind: 'letter', pattern: /b/g },
    ],
  });
  const source = 'ab🙂abab';
  const expected = [
    { kind: 'pair', value: 'ab' },
    { kind: 'plain', value: '🙂' },
    { kind: 'pair', value: 'ab' },
    { kind: 'pair', value: 'ab' },
  ];
  for (let index = 0; index < 20; index++) {
    assert.deepEqual(language.tokenize(source), expected);
    assert.deepEqual(language.tokenize('🙂bb'), [
      { kind: 'plain', value: '🙂' },
      { kind: 'letter', value: 'b' },
      { kind: 'letter', value: 'b' },
    ]);
  }
  assert.equal(language.tokenize(source).map(token => token.value).join(''), source);
});
