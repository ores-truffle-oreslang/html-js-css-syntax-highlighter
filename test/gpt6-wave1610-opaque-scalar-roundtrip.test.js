import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, escapeHtml, htmlRenderer } from '../src/index.js';

test('five built-in grammars preserve source scalars and escape untrusted markup', () => {
  const languageIds = ['oreslang','html','css','javascript','astro'];
  let state = 0x1610ad91;
  for (let n = 0; n < 64; n++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const source = '🧬'.repeat(state % 5)
      + '<script type="text/x">const c = "&<>";</script>\r\n'
      + '/* #{ready} <& */ ' + '𝄞'.repeat((state >>> 10) % 4)
      + ' // <untrusted> ' + String.fromCharCode(0)
      + ' 🌿'.repeat((state >>> 17) % 3);
    for (const languageId of languageIds) {
      const tokens = defaultHighlighter.tokenize(source, languageId);
      assert.ok(tokens.every(t => typeof t.value === 'string' && t.value.length > 0),
        languageId + ': empty or malformed token');
      assert.equal(tokens.map(t => t.value).join(''), source,
        languageId + ': source lost at seed ' + n);
      const html = defaultHighlighter.highlight(source, languageId);
      assert.ok(html.includes('&lt;'), languageId + ': unescaped less-than');
      assert.ok(html.includes('&amp;'), languageId + ': unescaped ampersand');
      assert.ok(!html.includes('<script'), languageId + ': raw executable markup');
      assert.equal(htmlRenderer.render([{kind:'plain',value:source}]), escapeHtml(source));
    }
  }
});