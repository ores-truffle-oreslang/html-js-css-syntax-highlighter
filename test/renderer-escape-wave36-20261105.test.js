import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, escapeHtml, htmlRenderer, SyntaxHighlighter} from '../src/core.js';

test('HTML renderer escapes caller-controlled category, class prefix, and token bytes', () => {
  const category = 'keyword" data-owned="yes';
  const prefix = 'tok-" onmouseover="evil-';
  const payload = '<script title="x">&\'</script>';
  const output = htmlRenderer.render([{kind: category, value: payload}], {classPrefix: prefix});
  assert.equal(
    output,
    '<span class="' + escapeHtml(prefix + category) + '">' + escapeHtml(payload) + '</span>',
  );
  assert.ok(!output.includes('" onmouseover="'));
  assert.ok(!output.includes('<script'));
});

test('plain source is escaped without any wrapper, including quotes and Unicode', () => {
  const value = '<>&"\' 🧪 日本語';
  assert.equal(htmlRenderer.render([{kind: 'plain', value}]), escapeHtml(value));
});

test('end-to-end highlighter escapes source through the registered HTML renderer', () => {
  const grammar = createRegexLanguage({
    id: 'boundary-wave36',
    tokens: [{pattern: /<tag>/, kind: 'markup'}],
  });
  const highlighter = new SyntaxHighlighter({languages: [grammar]});
  assert.equal(
    highlighter.highlight('<tag>&"\'', 'boundary-wave36'),
    '<span class="tok-markup">&lt;tag&gt;</span>&amp;&quot;&#039;',
  );
});
