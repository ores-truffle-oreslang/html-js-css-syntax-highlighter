import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('anchored rules preserve CRLF and astral gaps with stable priority', () => {
  const language = createRegexLanguage({
    id: 'wave96-multiline',
    tokens: [
      { kind: 'header', pattern: /^A/ },
      { kind: 'one', pattern: /^one/i },
      { kind: 'beta', pattern: /^beta/i },
    ],
  });
  const source = 'A\r\none🙂\nBETA\r\none';
  const expected = [
    { kind: 'header', value: 'A' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'one', value: 'one' },
    { kind: 'plain', value: '🙂\n' },
    { kind: 'beta', value: 'BETA' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'one', value: 'one' },
  ];
  for (let i = 0; i < 12; i++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(item => item.value).join(''), source);
  }
});
