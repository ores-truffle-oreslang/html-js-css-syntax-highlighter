// Host-only plugin registry atomicity; no guest compiler or release assertion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

test('conflicting aliases fail before any new ID or name can be published', () => {
  const trusted = {kind: 'language', id: 'trusted52', aliases: ['shared52'], tokenize: code => [
    {kind: 'plain', value: code},
  ]};
  const highlighter = new SyntaxHighlighter({languages: [trusted]});
  const conflicting = {kind: 'language', id: 'new52', aliases: ['fresh52', 'shared52'],
    tokenize: code => [{kind: 'evil', value: code}]};
  assert.throws(() => highlighter.use(conflicting), /registration conflict/);
  assert.equal(highlighter.language('trusted52'), trusted);
  assert.equal(highlighter.language('shared52'), trusted);
  assert.equal(highlighter.language('new52'), undefined);
  assert.equal(highlighter.language('fresh52'), undefined);
  assert.equal(highlighter.highlight('<safe>', 'trusted52'), '&lt;safe&gt;');
});

test('invalid alias types are rejected without installing earlier names', () => {
  const highlighter = new SyntaxHighlighter();
  assert.throws(() => highlighter.use({
    kind: 'language', id: 'bad52', aliases: ['almost52', 12],
    tokenize: code => [{kind: 'plain', value: code}],
  }), /non-empty strings/);
  assert.equal(highlighter.language('bad52'), undefined);
  assert.equal(highlighter.language('almost52'), undefined);
});
