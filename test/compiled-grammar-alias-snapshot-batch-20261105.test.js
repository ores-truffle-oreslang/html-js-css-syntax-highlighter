import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('grammar aliases remain bound to validated construction-time values', () => {
  const aliases = ['old-alias'];
  const grammar = createRegexLanguage({
    id: 'canonical',
    aliases,
    tokens: [{ kind: 'keyword', pattern: /actor/ }],
  });
  aliases[0] = 'untrusted-alias';
  aliases.push('late-alias');
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  assert.strictEqual(highlighter.language('canonical'), grammar);
  assert.strictEqual(highlighter.language('old-alias'), grammar);
  assert.equal(highlighter.language('untrusted-alias'), undefined);
  assert.equal(highlighter.language('late-alias'), undefined);
  assert.deepEqual(grammar.tokenize('actor'), [{ kind: 'keyword', value: 'actor' }]);
});

test('callers cannot mutate grammar aliases by mutating their input array', () => {
  const aliases = ['ore'];
  const grammar = createRegexLanguage({
    id: 'ores',
    aliases,
    tokens: [{ pattern: 'ok', kind: 'word' }],
  });
  aliases.length = 0;
  assert.deepEqual(grammar.aliases, ['ore']);
});
