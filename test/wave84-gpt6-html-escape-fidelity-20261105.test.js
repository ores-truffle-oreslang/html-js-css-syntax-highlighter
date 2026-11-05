// Host-only HTML rendering regression: literal content, escaped metadata, no mutation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, escapeHtml } from '../src/core.js';

test('plain markup and hostile category metadata cannot create HTML elements', () => {
  const original = Object.freeze([
    Object.freeze({ kind: 'plain', value: '<img src=x onerror="go()">&\'\n' }),
    Object.freeze({ kind: 'arg" onclick="go()', value: '<b>"&\'' }),
  ]);
  const output = htmlRenderer.render(original, { classPrefix: 'tok-' });
  assert.equal(output,
    '&lt;img src=x onerror=&quot;go()&quot;&gt;&amp;&#039;\n'
      + '<span class="tok-arg&quot; onclick=&quot;go()">'
      + '&lt;b&gt;&quot;&amp;&#039;</span>');
  assert.equal(output.includes('<img'), false);
  assert.equal(output.includes(' onclick="go()"'), false);
  assert.equal(output.includes('<b>'), false);
  assert.deepEqual(original.map(x => x.kind), ['plain', 'arg" onclick="go()']);
});

test('repeated renders preserve tokens and escape independently each time', () => {
  const tokens = Object.freeze([
    Object.freeze({ kind: 'plain', value: '"&<>' }),
    Object.freeze({ kind: 'keyword', value: '#ready' }),
  ]);
  for (let i = 0; i < 20; i += 1) {
    assert.equal(htmlRenderer.render(tokens),
      '&quot;&amp;&lt;&gt;<span class="tok-keyword">#ready</span>');
    assert.equal(escapeHtml(tokens[0].value), '&quot;&amp;&lt;&gt;');
  }
});
