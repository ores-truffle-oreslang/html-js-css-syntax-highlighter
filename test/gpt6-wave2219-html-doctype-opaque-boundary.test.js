// Source-owned host lexer/renderer verification; not compiler guest evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, html, escapeHtml } from '../src/index.js';

test('built-in HTML doctype, comment, quoted attributes and entities retain their boundaries', () => {
  const source = '<!DOCTYPE html>\r\n<!-- <script> &amp; -->\n<a title="&amp; <b>" data-x=\'<img>\'>&lt;🚀</a>';
  const expected = html.tokenize(source);
  const values = kind => expected.filter(t => t.kind === kind).map(t => t.value);
  assert.deepEqual(values('doctype'), ['<!DOCTYPE html>']);
  assert.deepEqual(values('comment'), ['<!-- <script> &amp; -->']);
  assert.deepEqual(values('tag'), ['<a', '</a']);
  assert.deepEqual(values('attribute'), ['title', 'data-x']);
  assert.deepEqual(values('string'), ['"&amp; <b>"', "'<img>'"]);
  assert.deepEqual(values('entity'), ['&lt;']);
  assert.equal(expected.map(t => t.value).join(''), source);
  for (const id of ['html', 'htm']) {
    assert.equal(defaultHighlighter.language(id), html);
    for (let i=0; i<4; i++) {
      assert.deepEqual(defaultHighlighter.tokenize(source, id), expected);
      const rendered = defaultHighlighter.highlight(source, id);
      assert.equal(rendered.replace(/<\/?span(?:\s+[^>]*)?>/g, ''), escapeHtml(source));
      assert.equal(rendered.includes('<script>'), false);
      assert.equal(rendered.includes('<img>'), false);
    }
  }
});
