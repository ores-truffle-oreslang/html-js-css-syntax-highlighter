// Host plugin identity/ownership regression; no compiler guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer } from '../src/core.js';

test('renderer IDs are instance-local and conflicting replacement fails atomically', () => {
  const language = {
    kind: 'language', id: 'wave610-language', aliases: ['wave610-alias'],
    tokenize: code => [{kind: 'plain', value: code}],
  };
  const aRenderer = {
    kind: 'renderer', id: 'custom', render: tokens => 'A|' + tokens.map(t => t.value).join(''),
  };
  const bRenderer = {
    kind: 'renderer', id: 'custom', render: tokens => 'B|' + tokens.map(t => t.value).join(''),
  };
  const a = new SyntaxHighlighter({languages: [language], renderers: [htmlRenderer, aRenderer]});
  const b = new SyntaxHighlighter({languages: [language], renderers: [htmlRenderer, bRenderer]});
  assert.equal(a.highlight('💡', 'wave610-alias', {renderer: 'custom'}), 'A|💡');
  assert.equal(b.highlight('💡', 'wave610-alias', {renderer: 'custom'}), 'B|💡');
  assert.throws(() => a.use(bRenderer), /renderer registration conflict/);
  assert.equal(a.highlight('<unsafe>', 'wave610-language', {renderer: 'custom'}), 'A|<unsafe>');
  assert.equal(b.highlight('<unsafe>', 'wave610-language', {renderer: 'html'}), '&lt;unsafe&gt;');
  assert.equal(b.highlight('💡', 'wave610-language', {renderer: 'custom'}), 'B|💡');
});
