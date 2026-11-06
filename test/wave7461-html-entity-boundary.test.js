import test from 'node:test';
import assert from 'node:assert/strict';
import {html} from '../src/plugins/html.js';
import {SyntaxHighlighter} from '../src/core.js';

// Public HTML grammar must preserve hostile source without turning it into DOM.
test('mixed doctype/comment/attribute/entity boundaries preserve source and escape markup', () => {
  const source = [
    '<!DOCTYPE HTML>',
    '<!-- <script>&copy; @evil </script> -->',
    '<div data-x="&amp;" title="x <img>" aria-label="é">',
    '  &copy;&#x1F4A0; &not-a-real-entity',
    '</div>'
  ].join('\r\n');
  const highlighter = new SyntaxHighlighter({languages: [html]});
  const flags = {classPrefix: 'x" onclick="attack<&-'};
  let first;
  for (let iteration = 0; iteration < 5; iteration++) {
    for (const id of ['html','htm']) {
      const tokens = highlighter.tokenize(source, id);
      assert.equal(tokens.map(t => t.value).join(''), source);
      assert.ok(tokens.every(t => t.value.length > 0));
      assert.deepEqual(tokens[0], {kind:'doctype',value:'<!DOCTYPE HTML>'});
      assert.ok(tokens.some(t => t.kind === 'comment' && t.value.includes('<script>')));
      assert.ok(tokens.some(t => t.kind === 'attribute' && t.value === 'data-x'));
      assert.ok(tokens.some(t => t.kind === 'entity' && t.value === '&copy;'));
      assert.ok(tokens.some(t => t.kind === 'entity' && t.value === '&#x1F4A0;'));
      if(first) assert.deepEqual(tokens, first); else first=tokens;
      const rendered = highlighter.highlight(source, id, flags);
      assert.ok(rendered.includes('&lt;script&gt;'));
      assert.ok(rendered.includes('&amp;copy;'));
      assert.ok(rendered.includes('onclick=&quot;attack'));
      assert.ok(!rendered.includes('<script>'));
      assert.ok(!rendered.includes('onclick="attack'));
      assert.ok(rendered.includes('\r\n'));
    }
  }
});
