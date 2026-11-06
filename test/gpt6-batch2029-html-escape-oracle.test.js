import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, htmlRenderer, SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

const expectedEscape = text => Array.from(String(text), character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
})[character] ?? character).join('');

test('independent Unicode oracle covers HTML content and hostile class metadata', () => {
  const prefixes = ['token-', '"><img src=x onerror=1>', "tok-'&<\u2028"];
  const values = [
    '', 'plain', '<script>alert("x")</script>', '<&>"' + "'" + '>',
    '🧪𐐷😄\r\nA', 'a\u0000b\u2028\u2029', '&amp;&lt;', '\\u0026literal',
  ];
  for (const prefix of prefixes) {
    for (const value of values) {
      const tokens = Object.freeze([
        Object.freeze({kind: 'plain', value}),
        Object.freeze({kind: 'tag"><svg/onload=1', value})
      ]);
      const options = Object.freeze({classPrefix: prefix});
      const actual = htmlRenderer.render(tokens, options);
      const expected = expectedEscape(value)
        + '<span class="' + expectedEscape(prefix + tokens[1].kind)
        + '">' + expectedEscape(value) + '</span>';
      assert.equal(actual, expected);
      assert.ok(!actual.includes('<svg'));
      assert.ok(!actual.includes('<script'));
    }
  }
});

test('end-to-end output matches independently escaped token oracle on repeated Unicode input', () => {
  const language = createRegexLanguage({
    id: 'gpt6-2029-oracle',
    tokens: [{kind: 'markup', pattern: /<[^>]+>/}, {kind: 'ampersand', pattern: /&/}]
  });
  const h = new SyntaxHighlighter({languages: [language]});
  const source = '🧪<tag attr="&">😄 &\r\n<end>𐐷';
  const tokens = h.tokenize(source, language.id);
  assert.equal(tokens.map(token => token.value).join(''), source);
  const expected = tokens.map(token => token.kind === 'plain'
    ? expectedEscape(token.value)
    : '<span class="' + expectedEscape('tok-' + token.kind)
      + '">' + expectedEscape(token.value) + '</span>').join('');
  for (let repetition = 0; repetition < 16; repetition++) {
    assert.equal(h.highlight(source, language.id), expected);
  }
});
