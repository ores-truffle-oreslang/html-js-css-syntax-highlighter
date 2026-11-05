// Host registry transaction and cross-instance isolation; no compiler-backed guest claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('late ID and alias collisions do not partially register a language', () => {
  const first = createRegexLanguage({id: 'trusted-first', aliases: ['a', 'b'], tokens: [
    {kind: 'keyword', pattern: /first/},
  ]});
  const second = createRegexLanguage({id: 'trusted-second', aliases: ['c', 'd'], tokens: [
    {kind: 'keyword', pattern: /second/},
  ]});
  const lexer = new SyntaxHighlighter({languages: [first, second]});
  const blocked = createRegexLanguage({id: 'new-primary', aliases: ['new-alias', 'a', 'c'], tokens: [
    {kind: 'bad', pattern: /imposter/},
  ]});
  assert.throws(() => lexer.use(blocked), /language registration conflict: a/);
  for (const id of ['new-primary', 'new-alias']) {
    assert.equal(lexer.language(id), undefined, id);
  }
  for (const id of ['trusted-first', 'a', 'b']) assert.equal(lexer.language(id), first);
  for (const id of ['trusted-second', 'c', 'd']) assert.equal(lexer.language(id), second);

  const repaired = createRegexLanguage({id: 'new-primary', aliases: ['new-alias'], tokens: [
    {kind: 'approved', pattern: /approved/},
  ]});
  lexer.use(repaired);
  lexer.use(repaired);
  assert.equal(lexer.language('new-alias'), repaired);
  assert.deepEqual(lexer.tokenize('approved', 'new-alias'), [
    {kind: 'approved', value: 'approved'},
  ]);
  assert.deepEqual(lexer.tokenize('first', 'a'), [{kind: 'keyword', value: 'first'}]);
  assert.deepEqual(lexer.tokenize('second', 'c'), [{kind: 'keyword', value: 'second'}]);
  // Registry scope is per instance, so another editor instance may use the name.
  const separate = new SyntaxHighlighter();
  assert.equal(separate.use(blocked), separate);
  assert.equal(separate.language('new-alias'), blocked);
  assert.equal(lexer.language('new-alias'), repaired);
});
