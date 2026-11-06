// Source-owned HTML plugin contract; not AttoLang compiler or guest evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer } from '../src/core.js';
import { html } from '../src/plugins/html.js';

test('HTML markup/comment/entity precedence is deterministic and conserves UTF-16', () => {
  const highlighter = new SyntaxHighlighter({ languages: [html] });
  const corpus = [
    '<!DoCtYpE html><main data-x="&amp;" title=\'a>b\'>',
    '<!-- <fake return "&bogus;"> -->',
    '💠&amp; &#x1f4a0; &#123; &bad <b x="y">',
    '\r\n<MiXeD a="a\\\"b">text</MiXeD>\r\n',
  ];
  for (const source of corpus) {
    const baseline = highlighter.tokenize(source, 'html');
    assert.equal(baseline.map(t => t.value).join(''), source);
    assert.ok(baseline.every(t => t.value.length > 0));
    for (let i = 0; i < 6; i++) {
      assert.deepEqual(highlighter.tokenize(source, 'htm'), baseline);
      assert.deepEqual(highlighter.tokenize(source, 'html'), baseline);
      const expected = htmlRenderer.render(baseline, { classPrefix: 'x"<-'});
      assert.equal(highlighter.highlight(source, 'htm', { classPrefix: 'x"<-' }), expected);
      assert.ok(!expected.includes('<main'));
      assert.ok(!expected.includes('<fake'));
    }
  }
});

test('HTML comments remain opaque even when containing valid tag and entity shapes', () => {
  const source = '<!-- <div x="&amp;">&#10;</div> -->\r\n&copy;<hr x="yes">';
  const tokens = html.tokenize(source);
  assert.equal(tokens.map(t => t.value).join(''), source);
  assert.deepEqual(tokens.filter(t => t.kind === 'comment').map(t => t.value),
    ['<!-- <div x="&amp;">&#10;</div> -->']);
  assert.deepEqual(tokens.filter(t => t.kind === 'entity').map(t => t.value), ['&copy;']);
  assert.deepEqual(tokens.filter(t => t.kind === 'tag').map(t => t.value), ['<hr']);
  assert.equal(tokens.filter(t => t.kind === 'string').length, 1);
});

test('valid doctype and numeric entities take precedence over partial tag fragments', () => {
  const source = '<!DOCTYPE html lang="en"> &#12; &#xAB; <section>ok</section>';
  const tokens = html.tokenize(source);
  assert.equal(tokens.map(t => t.value).join(''), source);
  assert.equal(tokens.filter(t => t.kind === 'doctype').length, 1);
  assert.deepEqual(tokens.filter(t => t.kind === 'entity').map(t => t.value),
    ['&#12;', '&#xAB;']);
  assert.deepEqual(tokens.filter(t => t.kind === 'tag').map(t => t.value),
    ['<section', '</section']);
});
