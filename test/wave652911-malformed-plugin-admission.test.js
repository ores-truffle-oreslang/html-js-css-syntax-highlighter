import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('malformed plugin shapes do not leave names reserved or alter trusted rendering', () => {
  const known = createRegexLanguage({
    id: 'wave652911-trusted', aliases: ['wave652911-owner'],
    tokens: [{kind: 'trusted', pattern: /safe/u}],
  });
  const lexer = new SyntaxHighlighter({languages: [known]});
  const expected = lexer.highlight('safe', 'wave652911-owner');
  const invalid = [
    {kind: 'language', id: 'shadow', aliases: 'shadow', tokenize: () => []},
    {kind: 'language', id: 'shadow', aliases: ['usable', null], tokenize: () => []},
    {kind: 'language', id: 'shadow', aliases: ['usable'], tokenize: null},
    {kind: 'renderer', id: 'new-renderer', render: null},
    {kind: 'unknown', id: 'shadow', render: () => ''},
    {kind: 'language', id: '', aliases: [], tokenize: () => []},
  ];
  for (const value of invalid) {
    assert.throws(() => lexer.use(value), /aliases|tokenize|render|unknown|kind|ids/);
    assert.equal(lexer.language('shadow'), undefined);
    assert.equal(lexer.language('usable'), undefined);
    assert.equal(lexer.highlight('safe', 'wave652911-owner'), expected);
  }
  for (const rule of [
    null, {kind: '', pattern: /safe/}, {kind: 'bad', pattern: 7},
    {kind: 'bad', pattern: {}}
  ]) {
    assert.throws(() => createRegexLanguage({
      id: 'invalid-rules', tokens: [rule]
    }), TypeError);
  }
  const replacement = createRegexLanguage({
    id: 'shadow', aliases: ['usable'],
    tokens: [{kind: 'approved', pattern: /ok/u}],
  });
  lexer.use(replacement);
  assert.deepEqual(lexer.tokenize('ok', 'usable'), [{kind: 'approved', value: 'ok'}]);
  assert.equal(lexer.highlight('safe', 'wave652911-owner'), expected);
});
