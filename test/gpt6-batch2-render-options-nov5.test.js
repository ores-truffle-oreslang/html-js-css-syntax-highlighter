// HTML renderer host trust-boundary checks; no native guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, escapeHtml } from '../src/core.js';

test('escaping hostile classPrefix never mutates or promotes token values', () => {
  const plain = Object.freeze({ kind: 'plain', value: '🙂< & "' });
  const marked = Object.freeze({ kind: 'name', value: '𝄞<>&"\'' });
  const tokens = Object.freeze([plain, marked]);
  const prefix = 'x" onmouseover="alert(1) & ';
  const expected = escapeHtml(plain.value)
    + '<span class="' + escapeHtml(prefix + 'name') + '">'
    + escapeHtml(marked.value) + '</span>';

  for (let attempt = 0; attempt < 3; attempt++) {
    assert.equal(htmlRenderer.render(tokens, { classPrefix: prefix }), expected);
  }
  assert.equal(plain.value, '🙂< & "');
  assert.equal(marked.kind, 'name');
  assert.equal(tokens.length, 2);
  assert.ok(!expected.includes(' onmouseover="alert(1)'));
});
