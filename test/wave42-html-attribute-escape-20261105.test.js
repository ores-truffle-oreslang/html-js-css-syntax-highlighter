// Source-owned host regression: do not allow untrusted token metadata to become HTML attributes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, htmlRenderer} from '../src/core.js';

test('renderer escapes hostile category and class prefix without an attribute breakout', () => {
  const evil = '<img src=x onerror=alert(1)>&"\'';
  const prefix = 'tok-" onmouseover="attack"><script>';
  const kind = 'malicious" onclick="attack';
  const output = htmlRenderer.render([
    {kind: 'plain', value: evil},
    {kind, value: evil},
  ], {classPrefix: prefix});
  assert.equal(output, escapeHtml(evil) +
    '<span class="' + escapeHtml(prefix + kind) + '">' +
    escapeHtml(evil) + '</span>');
  assert.equal(output.includes('<script>'), false);
  assert.equal(output.includes('<img'), false);
  assert.equal(output.includes(' onclick="attack"'), false);
});

test('ordinary category rendering remains byte-stable with empty and punctuation tokens', () => {
  const tokens = [
    {kind: 'plain', value: ''},
    {kind: 'punctuation', value: '"&<>'},
    {kind: 'plain', value: 'done'},
  ];
  assert.equal(htmlRenderer.render(tokens),
    '<span class="tok-punctuation">&quot;&amp;&lt;&gt;</span>done');
});