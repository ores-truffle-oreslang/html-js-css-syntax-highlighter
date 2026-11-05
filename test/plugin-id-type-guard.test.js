import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

test('plugin registry requires primitive string kind and id before mutation', () => {
  const highlighter = new SyntaxHighlighter();
  for (const invalid of [42, {}, ['html'], new String('html'), Symbol('html')]) {
    assert.throws(() => highlighter.use({ kind: 'renderer', id: invalid, render: () => '' }), /plugins require kind and id/);
    assert.throws(() => highlighter.use({ kind: invalid, id: 'alias', tokenize: () => [] }), /plugins require kind and id/);
  }
  const safe = {kind: 'language', id: 'safe', tokenize: code => [{kind:'plain', value:code}]};
  highlighter.use(safe);
  assert.equal(highlighter.language('alias'), undefined);
  assert.equal(highlighter.highlight('<safe>', 'safe'), '&lt;safe&gt;');
});
