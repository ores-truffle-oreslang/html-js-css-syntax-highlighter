// Untrusted renderers cannot be looked up after invoking an untrusted lexer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer } from '../src/core.js';

test('unknown renderer fails before tokenize and leaves trusted renderers usable', () => {
  let scans = 0;
  const tokens = Object.freeze([Object.freeze({kind: 'kind', value: '<&>'})]);
  const language = {
    kind: 'language', id: 'wave2140b-render-order',
    aliases: ['wave2140b-render-alias'],
    tokenize() { scans++; return tokens; },
  };
  const highlighter = new SyntaxHighlighter({
    languages: [language],
    renderers: [htmlRenderer, {kind: 'renderer', id: 'plain', render: value => value.map(t => t.value).join('')}],
  });
  for (let i = 0; i < 8; i++) {
    assert.throws(
      () => highlighter.highlight('ignored', 'wave2140b-render-order', {renderer: 'unknown'}),
      /unknown renderer/,
    );
    assert.equal(scans, i * 2);
    assert.equal(highlighter.highlight('ignored', 'wave2140b-render-alias'), '<span class="tok-kind">&lt;&amp;&gt;</span>');
    assert.equal(highlighter.highlight('ignored', 'wave2140b-render-order', {renderer: 'plain'}), '<&>');
  }
  assert.equal(scans, 16);
  assert.deepEqual(tokens, [{kind: 'kind', value: '<&>'}]);
});
