import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('sparse token and alias arrays fail at language construction, not during use', () => {
  const missingRules = new Array(2);
  missingRules[1] = {kind: 'word', pattern: /x/};
  assert.throws(() => createRegexLanguage({
    id: 'gpt6-2029-sparse-tokens', tokens: missingRules
  }), /valid id, aliases and token rules/);

  const missingAliases = new Array(2);
  missingAliases[1] = 'valid-alias';
  assert.throws(() => createRegexLanguage({
    id: 'gpt6-2029-sparse-aliases', aliases: missingAliases,
    tokens: [{kind: 'word', pattern: /x/}]
  }), /valid id, aliases and token rules/);

  const valid = createRegexLanguage({
    id: 'gpt6-2029-valid', aliases: ['g6-2029'],
    tokens: [{kind: 'lower', pattern: /x/}, {kind: 'upper', pattern: /y/i}]
  });
  const highlighter = new SyntaxHighlighter({languages: [valid]});
  assert.equal(highlighter.language('g6-2029'), valid);
  for (let i = 0; i < 8; i++) {
    assert.deepEqual(highlighter.tokenize('xY', 'g6-2029'), [
      {kind: 'lower', value: 'x'}, {kind: 'upper', value: 'Y'}
    ]);
  }
});
