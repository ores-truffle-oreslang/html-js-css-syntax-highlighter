import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, htmlRenderer, createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Security boundary: renderer must not grant HTML element/attribute authority.
test('untrusted token kind and caller prefix are inert inside a class attribute', () => {
  const prefix = 'prefix" data-evil="<img src=x onerror=1>&';
  const kind = 'word" onclick="alert(1)';
  const value = '<script>alert("x")</script>\u0000💠&\r\n';
  const records = Object.freeze([
    Object.freeze({kind:'plain',value:'<head>&'}),
    Object.freeze({kind,value}),
    Object.freeze({kind:'plain',value:"'\"<"}),
  ]);
  const expected = escapeHtml('<head>&')
    + '<span class="' + escapeHtml(prefix + kind) + '">'
    + escapeHtml(value) + '</span>' + escapeHtml("'\"<");
  for (let n=0; n<12; n++) {
    const rendered = htmlRenderer.render(records,{classPrefix:prefix});
    assert.equal(rendered, expected);
    assert.equal(rendered.includes('<script>'), false);
    assert.equal(rendered.includes('<img'), false);
    assert.equal(rendered.includes(' onclick="'), false);
    assert.equal(rendered.includes(' data-evil="'), false);
    assert.equal(records[1].value,value);
  }
});

test('high-level HTML highlight escapes every untrusted plain gap exactly once', () => {
  const lang = createRegexLanguage({id:'batch5-html-boundary', tokens:[
    {kind:'keyword',pattern:/return/g}
  ]});
  const host = new SyntaxHighlighter({languages:[lang]});
  const source='</span>&💠\r\nreturn<script>"\'';
  const rendered = host.highlight(source,lang.id);
  assert.equal(rendered,
    '&lt;/span&gt;&amp;💠\r\n<span class="tok-keyword">return</span>&lt;script&gt;&quot;&#039;');
  assert.equal(host.tokenize(source,lang.id).map(item=>item.value).join(''),source);
});
