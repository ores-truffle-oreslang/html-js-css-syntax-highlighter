import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage, htmlRenderer } from '../src/core.js';

test('renderer escapes token text and untrusted span class components separately', () => {
  const tokens = [
    { kind: 'tag"><svg/onload=1>', value: '<&"\'🙂' },
    { kind: 'plain', value: '</span><script>alert(1)</script>' },
  ];
  const actual = htmlRenderer.render(tokens, { classPrefix: 'x" onmouseover="bad-' });
  assert.equal(actual,
    '<span class="x&quot; onmouseover=&quot;bad-tag&quot;&gt;&lt;svg/onload=1&gt;">' +
    '&lt;&amp;&quot;&#039;🙂</span>' +
    '&lt;/span&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.doesNotMatch(actual, /<svg|<script|onmouseover="bad-/);
});

test('highlighter applies the escaping boundary through registered language', () => {
  const lang = createRegexLanguage({ id: 'wave42-html-boundary', tokens: [
    { kind: 'angle', pattern: /<[^>]*>/ },
  ] });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  assert.equal(highlighter.highlight('<b> & <i>', lang.id),
    '<span class="tok-angle">&lt;b&gt;</span> &amp; ' +
    '<span class="tok-angle">&lt;i&gt;</span>');
});