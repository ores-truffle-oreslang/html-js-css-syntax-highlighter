// Host lexer regression only: no compiler guest or parity assertion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('leftmost Unicode token selection preserves CRLF and nonmatching scalar gaps', () => {
  const grammar = createRegexLanguage({
    id: 'wave225-crlf',
    tokens: [
      { kind: 'greek', pattern: /β/u },
      { kind: 'emoji', pattern: /🦊/u },
      { kind: 'word', pattern: /k+/u },
    ],
  });
  const source = '🔔\r\nβ🦊kk\r\nβ';
  const expected = [
    { kind: 'plain', value: '🔔\r\n' },
    { kind: 'greek', value: 'β' },
    { kind: 'emoji', value: '🦊' },
    { kind: 'word', value: 'kk' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'greek', value: 'β' },
  ];
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = grammar.tokenize(source);
    assert.deepEqual(result, expected);
    assert.equal(result.map(token => token.value).join(''), source);
  }
});
