// Character-by-character independent HTML oracle; host-only source tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

function escapeByCharacter(value) {
  let result = '';
  const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;' };
  for (const character of String(value)) {
    result += replacements[character] ?? character;
  }
  return result;
}

test('frozen adversarial tokens and prefix agree with independent HTML oracle', () => {
  const glyphs = ['<', '>', '&', '"', "'", '\0', '💠', '\r\n',
    '\u2028', ' ', 'X', '='];
  let seed = 0x8c9135ad;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const prefixes = ['tok-', '" onmouseover="payload', "'><script>", '💠<&'];
  for (let i = 0; i < 128; i++) {
    let source = '';
    for (let j = 0, n = next() % 24; j < n; j++) {
      source += glyphs[next() % glyphs.length];
    }
    const tokens = Object.freeze([
      Object.freeze({kind:'plain',value:source}),
      Object.freeze({kind:'keyword',value:source}),
      Object.freeze({kind:'plain',value:source}),
    ]);
    const prefix = prefixes[i % prefixes.length];
    const expected = escapeByCharacter(source)
      + '<span class="' + escapeByCharacter(prefix + 'keyword') + '">'
      + escapeByCharacter(source) + '</span>' + escapeByCharacter(source);
    assert.equal(htmlRenderer.render(tokens, {classPrefix:prefix}),expected);
    assert.equal(tokens[1].value,source);
  }
});

test('public highlight path preserves escaping without touching input', () => {
  const language = createRegexLanguage({
    id:'wave1712-html', tokens:[{kind:'marked',pattern:/ab/}]
  });
  const highlighter = new SyntaxHighlighter({languages:[language]});
  const source = '💠<&ab"\'\0ab\r\n';
  const expected = escapeByCharacter('💠<&')
    + '<span class="tok-marked">ab</span>' + escapeByCharacter('"\'\0')
    + '<span class="tok-marked">ab</span>' + escapeByCharacter('\r\n');
  assert.equal(highlighter.highlight(source,language.id),expected);
  assert.equal(highlighter.tokenize(source,language.id)
    .map(token => token.value).join(''),source);
});
