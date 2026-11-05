// Host-only grammar snapshot tests; no AttoLang guest/compiler execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('caller replacement, truncation and append cannot change a compiled grammar', () => {
  const aliases = ['original-alias'];
  const tokens = [
    { kind: 'first', pattern: /foo/ },
    { kind: 'second', pattern: /BAR/ },
  ];
  const grammar = createRegexLanguage({ id: 'wave43-array-copy', aliases, tokens });
  const source = 'foo bar BAR';
  const expected = [
    { kind: 'first', value: 'foo' },
    { kind: 'plain', value: ' bar ' },
    { kind: 'second', value: 'BAR' },
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  tokens[0] = { kind: 'replacement', pattern: /bar/ };
  tokens.push({ kind: 'late', pattern: /BAR/ });
  tokens.length = 0;
  aliases[0] = 'forged-alias';
  aliases.push('late-alias');
  assert.deepEqual(grammar.aliases, ['original-alias']);
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});
