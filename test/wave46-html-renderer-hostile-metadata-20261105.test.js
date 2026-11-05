// Host-only rendering boundary; no compiled guest HTML execution claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('untrusted token categories cannot inject markup or attributes', () => {
  const rendered = htmlRenderer.render([
    {kind: 'x" onclick="alert(1)', value: '<img src=x onerror=1>&'},
    {kind: 'plain', value: '\"\'<end>&'},
  ]);
  assert.equal(rendered,
    '<span class="tok-x&quot; onclick=&quot;alert(1)">&lt;img src=x onerror=1&gt;&amp;</span>'
    + '&quot;&#039;&lt;end&gt;&amp;');
  assert.equal(rendered.includes('<img'), false);
  assert.equal(rendered.includes(' onclick="'), false);
});

test('source text and hostile class prefix are escaped independently end-to-end', () => {
  const language = createRegexLanguage({id: 'wave46-hostile-prefix', tokens: [
    {kind: 'word', pattern: /[A-Z]+/u},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const rendered = highlighter.highlight('ABC <script> &', language.id, {
    classPrefix: 'x" onmouseover="bad-',
  });
  assert.equal(rendered,
    '<span class="x&quot; onmouseover=&quot;bad-word">ABC</span> &lt;script&gt; &amp;');
  assert.equal(rendered.includes(' onmouseover="'), false);
});
