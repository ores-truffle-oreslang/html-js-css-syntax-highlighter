import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('compiled lexer owns each rule flag and preserves original Unicode/CRLF source', () => {
  const dotall = /a.b/s;
  const caseInsensitive = /word/i;
  const emoji = /\u{1F600}/u;
  dotall.lastIndex = 8;
  caseInsensitive.lastIndex = 12;
  const grammar = createRegexLanguage({
    id: 'case-and-dotall',
    tokens: [
      {kind: 'multiline', pattern: dotall},
      {kind: 'case', pattern: caseInsensitive},
      {kind: 'emoji', pattern: emoji},
    ],
  });
  const source = '😀 WORD a\nb\r\nword A\nB 😀';
  let expected;
  for (let iteration = 0; iteration < 32; iteration++) {
    const tokens = grammar.tokenize(source);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.deepEqual(tokens.filter(t => t.kind !== 'plain').map(t => [t.kind, t.value]), [
      ['emoji', '😀'], ['case', 'WORD'], ['multiline', 'a\nb'],
      ['case', 'word'], ['emoji', '😀'],
    ]);
    if (expected) assert.deepEqual(tokens, expected);
    expected = tokens;
    const alternate = grammar.tokenize('word a\nb 😀');
    assert.deepEqual(alternate.filter(t => t.kind !== 'plain').map(t => t.kind),
      ['case', 'multiline', 'emoji']);
  }
  assert.equal(dotall.lastIndex, 8);
  assert.equal(caseInsensitive.lastIndex, 12);
  assert.equal(emoji.lastIndex, 0);
});
