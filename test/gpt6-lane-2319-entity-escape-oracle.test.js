import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, escapeHtml } from '../src/core.js';

function oracle(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return Array.from(String(value), char => entities[char] ?? char).join('');
}
test('HTML renderer escapes untrusted token text and attribute identity', () => {
  const raw = '\0<&"\'🙂\n';
  const kind = 'tag" onmouseenter="payload<&';
  const prefix = 'scope" data-x="forged<&';
  const language = { kind: 'language', id: 'entity-oracle', aliases: ['entity-alias'],
    tokenize: () => [{ kind: 'plain', value: raw }, { kind, value: '🙂<unsafe>&"\'' }] };
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const expected = oracle(raw) + '<span class="' + oracle(prefix + kind)
    + '">' + oracle('🙂<unsafe>&"\'') + '</span>';
  assert.equal(highlighter.highlight('ignored', 'entity-alias', { classPrefix: prefix }), expected);
  assert.equal(highlighter.highlight('ignored', 'entity-oracle', { classPrefix: prefix }), expected);
  assert.equal(escapeHtml(raw), oracle(raw));
  assert.equal(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#039;');
});
