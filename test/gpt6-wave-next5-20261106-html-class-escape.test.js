import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/index.js';

test('HTML renderer escapes hostile class prefixes and source text without modifying tokens', () => {
  const prefix = 'p" onclick="bad\'<&';
  const tokens = [
    { kind: 'keyword', value: '<&"\'>' },
    { kind: 'plain', value: 'safe <& >' },
  ];
  const expected =
    '<span class="p&quot; onclick=&quot;bad&#039;&lt;&amp;keyword">&lt;&amp;&quot;&#039;&gt;</span>' +
    'safe &lt;&amp; &gt;';
  for (let attempt = 0; attempt < 32; attempt++) {
    assert.equal(htmlRenderer.render(tokens, { classPrefix: prefix }), expected);
  }
  assert.deepEqual(tokens, [
    { kind: 'keyword', value: '<&"\'>' },
    { kind: 'plain', value: 'safe <& >' },
  ]);
  assert.equal(htmlRenderer.render([{kind:'plain',value:'<script>&"}'}]), '&lt;script&gt;&amp;&quot;}');
});