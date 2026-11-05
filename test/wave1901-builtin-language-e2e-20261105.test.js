import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultHighlighter, highlight, oreslang, javascript, html, css, astro, escapeHtml,
} from '../src/index.js';

// End-to-end public API: actual built-in lexer and renderer, no synthetic grammar.
test('all built-in languages preserve untrusted source through interleaved rendering', () => {
  const fixtures = [
    [oreslang, "let message = '<script>alert(1)</script>'\r\n#ready 👾 &"],
    [javascript, 'const unsafe = "<img src=x>";\r\n// 🚀 &'],
    [html, '<a title="unsafe & value">🚀 \'quoted\'</a>'],
    [css, '.x::before { content: "<&>"; }\r\n/* 🚀 */'],
    [astro, '---\nconst value = "<&>"\n---\n<div>🚀 &amp;</div>'],
  ];
  assert.equal(fixtures.length, 5);
  for (let iteration = 0; iteration < 6; iteration++) {
    for (const [plugin, source] of fixtures) {
      assert.equal(defaultHighlighter.language(plugin.id), plugin);
      const tokens = defaultHighlighter.tokenize(source, plugin.id);
      assert.equal(tokens.map(token => token.value).join(''), source,
        plugin.id + ': lexer must preserve every UTF-16 source unit');
      const rendered = highlight(source, plugin.id);
      assert.equal(rendered, defaultHighlighter.highlight(source, plugin.id));
      assert.equal(rendered.replace(/<\/?span(?:\s+[^>]*)?>/g, ''), escapeHtml(source),
        plugin.id + ': actual HTML renderer must escape all source text');
      assert.equal(rendered.includes('<script>'), false);
      assert.equal(rendered.includes('<img src='), false);
      assert.equal(rendered.includes('<div>'), false);
    }
  }
});
