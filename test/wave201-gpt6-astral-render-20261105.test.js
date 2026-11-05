import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

test('HTML rendering escapes hostile token/class bytes without mutating astral text', () => {
  const source = '🙂&<>"\'𝄞';
  const tokens = Object.freeze([
    Object.freeze({ kind: 'plain', value: source }),
    Object.freeze({ kind: 'x" onmouseover="alert(1)', value: source }),
  ]);
  const options = Object.freeze({ classPrefix: 'pre"<bad&' });
  const rendered = htmlRenderer.render(tokens, options);
  const escaped = '🙂&amp;&lt;&gt;&quot;&#039;𝄞';
  assert.equal(rendered, escaped +
    '<span class="pre&quot;&lt;bad&amp;x&quot; onmouseover=&quot;alert(1)">' + escaped + '</span>');
  assert.deepEqual(tokens.map(t => t.value), [source, source]);
  assert.equal(htmlRenderer.render(tokens, options), rendered);
});
