// Host-rendering trust boundary; not browser E2E or guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage, htmlRenderer } from '../src/core.js';

test('Unicode source, HTML content, and class metadata escape without token mutation', () => {
  const tokens = [
    { kind: 'plain', value: '💠<a href="x&y">' },
    { kind: 'evil" onclick="alert(1)', value: '<script>&"\'🌙' },
    { kind: 'plain', value: '</a>' },
  ];
  const snapshot = structuredClone(tokens);
  const expected = '💠&lt;a href=&quot;x&amp;y&quot;&gt;'
    + '<span class="c&amp;evil&quot; onclick=&quot;alert(1)">'
    + '&lt;script&gt;&amp;&quot;&#039;🌙</span>&lt;/a&gt;';
  for (let n = 0; n < 3; n++) {
    assert.equal(htmlRenderer.render(tokens, { classPrefix: 'c&' }), expected);
    assert.deepEqual(tokens, snapshot);
  }
});

test('highlighter retains the original source while escaping plain and marked runs', () => {
  const grammar = createRegexLanguage({
    id: 'wave321-integrated', tokens: [{ kind: 'word', pattern: /abc/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const code = '<abc>&"\'💠';
  assert.equal(highlighter.tokenize(code, grammar.id).map(t => t.value).join(''), code);
  assert.equal(highlighter.highlight(code, grammar.id),
    '&lt;<span class="tok-word">abc</span>&gt;&amp;&quot;&#039;💠');
});
