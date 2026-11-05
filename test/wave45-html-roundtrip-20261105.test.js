// Host-only HTML rendering regression; no compiler guest or browser parity claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

test('plain source and class metadata are both escaped in the same render', () => {
  const tokens = [
    { kind: 'plain', value: '<b>&"\'</b>' },
    { kind: 'quote" onclick="x', value: '<script>' },
  ];
  assert.equal(
    htmlRenderer.render(tokens, { classPrefix: 'k&' }),
    '&lt;b&gt;&amp;&quot;&#039;&lt;/b&gt;' +
      '<span class="k&amp;quote&quot; onclick=&quot;x">&lt;script&gt;</span>',
  );
});
