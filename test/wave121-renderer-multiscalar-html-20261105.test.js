// End-to-end host renderer escaping, not a compiled guest HTML execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter, htmlRenderer, escapeHtml} from '../src/core.js';

test('mixed Unicode plaintext and marked text escape exactly once', () => {
  const language = createRegexLanguage({
    id: 'wave121-html',
    tokens: [{kind: 'symbol', pattern: /&/u}],
  });
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const input = '😀<&\'"🙂';
  const result = highlighter.highlight(input, 'wave121-html', {
    classPrefix: 'edge" onclick="',
  });
  const expected = '😀&lt;<span class="edge&quot; onclick=&quot;symbol">&amp;</span>&#039;&quot;🙂';
  assert.equal(result, expected);
  assert.equal(result.includes(' onclick="'), false);
  assert.deepEqual(highlighter.tokenize(input, 'wave121-html').map(t => t.value).join(''), input);
  assert.equal(escapeHtml(input), '😀&lt;&amp;&#039;&quot;🙂');
});

test('escaped plain and marked tokens are byte-identical for the same literal', () => {
  for (const source of ['<&>"\' 😀', '\n\t&', '🙂<\n>', '&amp;']) {
    const plain = htmlRenderer.render([{kind: 'plain', value: source}]);
    const marked = htmlRenderer.render([{kind: 'quoted', value: source}], {classPrefix: 'c-'});
    assert.equal(plain, escapeHtml(source));
    assert.equal(marked, '<span class="c-quoted">' + plain + '</span>');
    assert.equal(htmlRenderer.render([{kind: 'plain', value: source}]), plain);
  }
});
