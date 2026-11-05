// Host lexical and HTML rendering regression; not a compiler-guest parity test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('mixed astral symbols, CRLF and markup survive lexical spans byte-for-byte', () => {
  const lang = createRegexLanguage({
    id: 'host-source-integrity-crlf',
    tokens: [{ kind: 'word', pattern: /[A-Za-z]+/ }, { kind: 'number', pattern: /\d+/ }],
  });
  const input = '🙂alpha\r\n42\t<&β';
  const expected = [
    { kind: 'plain', value: '🙂' },
    { kind: 'word', value: 'alpha' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'number', value: '42' },
    { kind: 'plain', value: '\t<&β' },
  ];
  for (let i = 0; i < 3; i++) {
    const tokens = lang.tokenize(input);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), input);
  }
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  assert.equal(
    highlighter.highlight(input, lang.id),
    '🙂<span class="tok-word">alpha</span>\r\n<span class="tok-number">42</span>\t&lt;&amp;β',
  );
});
