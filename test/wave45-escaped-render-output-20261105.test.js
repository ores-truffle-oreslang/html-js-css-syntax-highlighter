import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Source-owned host rendering checks. No browser, compiler or guest parity claim.
test('renderer never interprets pre-escaped entities or untrusted span classes', () => {
  const tokens = [
    { kind: 'plain', value: '&lt; <&>"\'' },
    { kind: 'quote" onload="x', value: '</span><img src=x onerror=1>' },
    { kind: 'plain', value: '&amp;' },
  ];
  const html = htmlRenderer.render(tokens, { classPrefix: 'cls&"<' });
  assert.equal(html,
    '&amp;lt; &lt;&amp;&gt;&quot;&#039;' +
    '<span class="cls&amp;&quot;&lt;quote&quot; onload=&quot;x">' +
    '&lt;/span&gt;&lt;img src=x onerror=1&gt;</span>' +
    '&amp;amp;');
  assert.doesNotMatch(html, /<img|<\/span><img|onload="x"/);
});

test('highlight retains encoded text identity without decoding it into markup', () => {
  const language = createRegexLanguage({
    id: 'wave45-entity-preservation',
    tokens: [{ kind: 'entity', pattern: /&lt;/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  assert.equal(highlighter.highlight('&lt;<b>', language.id),
    '<span class="tok-entity">&amp;lt;</span>&lt;b&gt;');
});
