// Source-owned host lexer regression; not compiler guest or backend parity evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('same-offset priority is stable across repeated mixed UTF-16 source scans', () => {
  const language = createRegexLanguage({
    id: 'batch2-lexer-priority',
    tokens: [
      { kind: 'keyword', pattern: /foo/ },
      { kind: 'word', pattern: /[a-z]+/ },
    ],
  });
  const source = '🙂foo--bar\r\nfoo';
  const expected = [
    { kind: 'plain', value: '🙂' },
    { kind: 'keyword', value: 'foo' },
    { kind: 'plain', value: '--' },
    { kind: 'word', value: 'bar' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'keyword', value: 'foo' },
  ];
  for (let attempt = 0; attempt < 4; attempt++) {
    const tokens = language.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), source);
  }
});
