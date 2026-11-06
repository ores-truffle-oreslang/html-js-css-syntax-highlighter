import test from 'node:test';
import assert from 'node:assert/strict';
import { html } from '../src/plugins/html.js';
import { SyntaxHighlighter } from '../src/core.js';

test('HTML doctype/comment/entities preserve source and alias renderer identity', () => {
  const source = '<!DOCTYPE html>\r\n<!-- <b>&amp;</b> -->\n<div title="&amp;">&amp; &#x1F48E; &#65;</div>';
  const original = new TextEncoder().encode(source);
  const highlighter = new SyntaxHighlighter({languages:[html]});
  for (let i=0;i<8;i++) {
    const tokens = html.tokenize(source);
    assert.deepEqual(new TextEncoder().encode(tokens.map(t=>t.value).join('')), original);
    assert.ok(tokens.some(t=>t.kind==='doctype' && t.value==='<!DOCTYPE html>'));
    assert.ok(tokens.some(t=>t.kind==='comment' && t.value==='<!-- <b>&amp;</b> -->'));
    assert.ok(tokens.some(t=>t.kind==='string' && t.value==='"&amp;"'));
    for (const entity of ['&amp;','&#x1F48E;','&#65;']) {
      assert.ok(tokens.some(t=>t.kind==='entity' && t.value===entity),'missing entity '+entity);
    }
    const rendered = highlighter.highlight(source,'html');
    assert.equal(rendered,highlighter.highlight(source,'htm'));
    assert.ok(rendered.includes('&amp;amp;'));
    assert.ok(!rendered.includes('<!-- <b>'));
  }
});

test('HTML attribute markup does not execute and remains byte-preserved', () => {
  const source = '<a title="<script>&amp;</script>">&amp;</a>';
  const before = html.tokenize(source);
  const rendered = new SyntaxHighlighter({languages:[html]}).highlight(source,'htm');
  assert.equal(before.map(t=>t.value).join(''),source);
  assert.ok(!rendered.includes('<script>'));
  assert.ok(rendered.includes('&lt;script&gt;'));
  assert.deepEqual(html.tokenize(source),before);
});
