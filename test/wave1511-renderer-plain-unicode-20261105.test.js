import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, htmlRenderer, SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

// Source-owned HTML host regression, not compiled AttoLang guest execution.
test('plain tokens never gain markup authority even across NUL and Unicode boundaries', () => {
  const malicious = '💠\0<&>"\'\r\n<script>\u2028';
  const tokens = Object.freeze([
    Object.freeze({kind:'plain',value: malicious}),
    Object.freeze({kind:'keyword',value:'<&"\'💠'}),
    Object.freeze({kind:'plain',value: malicious}),
  ]);
  const expected = escapeHtml(malicious)
    + '<span class="tok-keyword">' + escapeHtml('<&"\'💠') + '</span>'
    + escapeHtml(malicious);
  for (let i=0;i<4;i++) {
    assert.equal(htmlRenderer.render(tokens),expected);
    assert.equal(htmlRenderer.render(tokens,{classPrefix:'prefix" onmouseover="bad-'}),
      escapeHtml(malicious)
      + '<span class="prefix&quot; onmouseover=&quot;bad-keyword">' + escapeHtml('<&"\'💠') + '</span>'
      + escapeHtml(malicious));
    assert.equal(tokens[0].value, malicious);
  }
});

test('highlighter exact source reconstruction retains escaped plain prefix and suffix', () => {
  const grammar=createRegexLanguage({id:'wave1511-inline',tokens:[
    {kind:'word',pattern:/return/}
  ]});
  const highlighter=new SyntaxHighlighter({languages:[grammar]});
  const source='💠<&\r\nreturn\0"\'';
  assert.equal(highlighter.tokenize(source,grammar.id).map(t=>t.value).join(''),source);
  assert.equal(highlighter.highlight(source,grammar.id),
    '💠&lt;&amp;\r\n<span class="tok-word">return</span>\0&quot;&#039;');
});
