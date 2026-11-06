// Verify zero-width rules cannot monopolize Unicode scanning or lose bytes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('zero-width multiline assertions advance by Unicode scalar and do not consume source', () => {
  const language = createRegexLanguage({
    id: 'gpt6-wave2030-empty-match',
    tokens: [
      {kind: 'assertion', pattern: /(?=🙂)|^/m},
      {kind: 'emoji', pattern: /🙂/u},
      {kind: 'word', pattern: /foo/},
    ],
  });
  const source = '🙂\nfoo\r\n🙂\nend';
  const expected = [
    {kind: 'emoji', value: '🙂'},
    {kind: 'plain', value: '\n'},
    {kind: 'word', value: 'foo'},
    {kind: 'plain', value: '\r\n'},
    {kind: 'emoji', value: '🙂'},
    {kind: 'plain', value: '\nend'},
  ];
  for (let attempt = 0; attempt < 16; attempt++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), source);
    assert.ok(actual.every(token => token.value.length > 0));
  }
});
