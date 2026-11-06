// Independently specified HTML text/attribute escaping, source-only host proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

function referenceEscape(input) {
  let output = '';
  for (const scalar of String(input)) {
    switch (scalar) {
      case '&': output += '&amp;'; break;
      case '<': output += '&lt;'; break;
      case '>': output += '&gt;'; break;
      case '"': output += '&quot;'; break;
      case "'": output += '&#039;'; break;
      default: output += scalar;
    }
  }
  return output;
}

test('hostile frozen token arrays and class prefixes use separate escaping contexts', () => {
  const prefix = 'x" onclick="malicious<&\u2028-';
  const options = Object.freeze({ classPrefix: prefix });
  const alphabet = ['<', '>', '&', '"', "'", '💠', '\r', '\n', '\0', 'a', '0', ' ', '\u2028'];
  let state = 0x239100ab;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };

  for (let sample = 0; sample < 175; sample++) {
    const tokens = [];
    let expected = '';
    for (let i = 0; i < 1 + next() % 9; i++) {
      let value = '';
      for (let j = 0; j < next() % 13; j++) value += alphabet[next() % alphabet.length];
      const kind = i % 3 === 0 ? 'plain' : i % 3 === 1 ? 'tag' : 'entity';
      tokens.push(Object.freeze({ kind, value }));
      expected += kind === 'plain'
        ? referenceEscape(value)
        : '<span class="' + referenceEscape(prefix + kind) + '">' +
          referenceEscape(value) + '</span>';
    }
    Object.freeze(tokens);
    for (let replay = 0; replay < 3; replay++) {
      assert.equal(htmlRenderer.render(tokens, options), expected, 'sample ' + sample);
      assert.equal(options.classPrefix, prefix);
      assert.ok(!expected.includes('onclick="malicious'));
      assert.ok(!expected.includes('<script>'));
    }
  }
});

test('real highlighter preserves literal source while escaping source and class independently', () => {
  const lang = createRegexLanguage({
    id: 'wave2391-escape',
    tokens: [{ kind: 'keyword', pattern: /return/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  const prefix = 'q" autofocus onfocus="bad-&';
  const options = Object.freeze({ classPrefix: prefix });
  for (const source of [
    '💠 <return>&"\'\r\n',
    'return &amp; <span class="x">',
    '\0return\u2028return\r\n',
  ]) {
    const tokens = highlighter.tokenize(source, lang.id);
    assert.equal(tokens.map(token => token.value).join(''), source);
    const expected = tokens.map(token => token.kind === 'plain'
      ? referenceEscape(token.value)
      : '<span class="' + referenceEscape(prefix + token.kind) + '">' +
        referenceEscape(token.value) + '</span>').join('');
    assert.equal(highlighter.highlight(source, lang.id, options), expected);
  }
});
