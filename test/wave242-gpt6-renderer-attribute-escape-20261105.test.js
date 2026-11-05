// Host-only HTML output safety: hostile token metadata stays within the class attribute.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

test('renderer escapes plain text, classPrefix and token.kind independently', () => {
  const tokens = [
    { kind: 'plain', value: '<>&' },
    { kind: 'attack" onclick="run()', value: '<img src=x>&"' },
  ];
  const actual = htmlRenderer.render(tokens, { classPrefix: 'x" data-hook="Z' });
  assert.equal(actual,
    '&lt;&gt;&amp;<span class="x&quot; data-hook=&quot;Zattack&quot; onclick=&quot;run()">&lt;img src=x&gt;&amp;&quot;</span>');
  assert.ok(!actual.includes('<img'));
  assert.ok(!actual.includes('onclick="run()"'));
  assert.deepEqual(tokens, [
    { kind: 'plain', value: '<>&' },
    { kind: 'attack" onclick="run()', value: '<img src=x>&"' },
  ]);
});
