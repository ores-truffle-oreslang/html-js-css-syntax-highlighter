import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('untrusted token kind and class prefix remain HTML-attribute data', () => {
  const lang = createRegexLanguage({
    id: 'wave1607-html-class-safety',
    tokens: [{ kind: 'k"', pattern: /token<&"/ }]
  });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  const source = 'token<&" <script>alert(1)</script>';
  const html = highlighter.highlight(source, lang.id, {
    classPrefix: 'x" onmouseover="evil&'
  });

  assert.equal(html,
    '<span class="x&quot; onmouseover=&quot;evil&amp;k&quot;">' +
    'token&lt;&amp;&quot;</span> &lt;script&gt;alert(1)&lt;/script&gt;');
  assert.ok(!html.includes(' onmouseover="evil'), 'no injected HTML attribute');
  assert.ok(!html.includes('<script>'), 'untrusted source stays escaped');
  assert.deepEqual(highlighter.tokenize(source, lang.id).map(t => t.value).join(''), source);
});

test('plain Unicode and markup cannot escape the HTML renderer', () => {
  const lang = createRegexLanguage({
    id: 'wave1607-html-plain',
    tokens: [{ kind: 'word', pattern: /safe/ }]
  });
  const h = new SyntaxHighlighter({ languages: [lang] });
  const input = '🦊 <img src=x onerror=alert(1)> & " \u0000 safe';
  const html = h.highlight(input, lang.id);
  assert.ok(html.includes('🦊 &lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('&amp; &quot;'));
  assert.ok(html.endsWith('<span class="tok-word">safe</span>'));
  assert.equal(h.tokenize(input, lang.id).map(t => t.value).join(''), input);
});
