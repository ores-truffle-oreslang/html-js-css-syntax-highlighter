// Source-owned scanner regression; does not establish AttoLang compiler parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('multiline anchors and dotAll consume exactly their own source spans', () => {
  const header = /^HEAD\nnext/i;
  header.lastIndex = 2;
  const language = createRegexLanguage({
    id: 'wave1710-multiline',
    tokens: [
      { kind: 'header', pattern: header },
      { kind: 'cross-line', pattern: /A.B/s },
      { kind: 'emoji', pattern: /🙂/u },
    ],
  });
  const source = 'HEAD\nnext\r\nA\nB🙂\r\nHEAD\nnext';
  const expected = [
    { kind: 'header', value: 'HEAD\nnext' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'cross-line', value: 'A\nB' },
    { kind: 'emoji', value: '🙂' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'header', value: 'HEAD\nnext' },
  ];
  for (let attempt = 0; attempt < 16; attempt++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), source);
    assert.equal(header.lastIndex, 2, 'caller-owned cursor is unchanged');
  }
});
