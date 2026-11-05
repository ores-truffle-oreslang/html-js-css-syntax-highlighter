import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

const plugin = (id, aliases) => ({ kind: 'language', id, aliases, tokenize: () => [] });

test('a string alias cannot register individual characters as language IDs', () => {
  const h = new SyntaxHighlighter();
  assert.throws(() => h.use(plugin('str-alias', 'admin')), /aliases must be an array/);
  for (const name of ['str-alias', 'a', 'd', 'm', 'i', 'n']) {
    assert.equal(h.language(name), undefined, name);
  }
});
test('a Set and an object alias list are rejected before registry mutation', () => {
  const h = new SyntaxHighlighter();
  for (const aliases of [new Set(['language']), {0: 'language', length: 1}]) {
    assert.throws(() => h.use(plugin('untrusted', aliases)), /aliases must be an array/);
    assert.equal(h.language('untrusted'), undefined);
    assert.equal(h.language('language'), undefined);
  }
});
test('canonical array and absent alias lists remain supported', () => {
  const h = new SyntaxHighlighter();
  const a = plugin('safe', ['s']);
  const b = plugin('no-alias', undefined);
  h.use(a).use(b);
  assert.equal(h.language('safe'), a);
  assert.equal(h.language('s'), a);
  assert.equal(h.language('no-alias'), b);
});
