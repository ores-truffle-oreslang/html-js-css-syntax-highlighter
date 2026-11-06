import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter} from '../src/core.js';
import {html} from '../src/plugins/html.js';
import {css} from '../src/plugins/css.js';
import {javascript} from '../src/plugins/javascript.js';

test('built-in HTML, CSS and JavaScript comments hide lexically hostile inner source', () => {
  const highlighter = new SyntaxHighlighter({languages: [html, css, javascript]});
  const cases = [
    {id:'html', alias:'htm', comment:'<!-- <script> const x=7; </script> &amp; -->'},
    {id:'css', alias:'css', comment:'/* @media screen { color: #abc; } */'},
    {id:'javascript', alias:'ts', comment:'/* const x = 7; function f(){} */'},
  ];
  for (const {id,alias,comment} of cases) {
    const source = 'z' + comment + 'w';
    const expected = [
      {kind:'plain',value:'z'},
      {kind:'comment',value:comment},
      {kind:'plain',value:'w'},
    ];
    for(let i=0;i<25;i++) {
      assert.deepEqual(highlighter.tokenize(source, id), expected, id);
      assert.deepEqual(highlighter.tokenize(source, alias), expected, alias);
      const rendered = highlighter.highlight(source, alias);
      assert.ok(rendered.startsWith('z<span class="tok-comment">'), id);
      assert.ok(rendered.endsWith('</span>w'), id);
      assert.ok(!rendered.includes('<script>'), 'HTML comment source must remain escaped');
      assert.equal(expected.map(t=>t.value).join(''), source);
    }
  }
});
