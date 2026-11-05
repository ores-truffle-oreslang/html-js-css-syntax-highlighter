// Source-owned HTML escaping and token ownership tests; no compiler guest proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, escapeHtml } from '../src/core.js';

test('untrusted token categories and source values escape without mutating tokens', () => {
  const token = { kind: 'tag" onclick="x', value: '💡<&"\'猫' };
  const plain = { kind: 'plain', value: '<img src=x onerror=x>💡' };
  const tokens = [token, plain];
  const snapshot = structuredClone(tokens);
  const expected = '<span class="' + escapeHtml('tok-' + token.kind) + '">' +
    escapeHtml(token.value) + '</span>' + escapeHtml(plain.value);
  assert.equal(htmlRenderer.render(tokens), expected);
  assert.equal(htmlRenderer.render(tokens), expected);
  assert.deepEqual(tokens, snapshot);
  assert.equal(expected.includes('<img'), false);
  assert.equal(expected.includes(' onclick="x"'), false);
});

test('empty plain and marked source remain distinct and stable', () => {
  assert.equal(htmlRenderer.render([{kind: 'plain', value: ''}, {kind: 'mark', value: ''}]),
    '<span class="tok-mark"></span>');
});
