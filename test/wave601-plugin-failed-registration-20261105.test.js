// Host-only lexer reentrancy: isolated source views, no guest claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('leftmost cursor resets across alternating short, long and newline sources', () => {
  const expression = /ab/g;
  expression.lastIndex = 50;
  const language = createRegexLanguage({
    id: 'wave601-reentrant',
    aliases: ['wave601-r'],
    tokens: [
      { kind: 'pair', pattern: expression },
      { kind: 'line-start', pattern: /^Z/m },
    ],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const fixtures = [
    ['ab\nZab', [
      { kind: 'pair', value: 'ab' }, { kind: 'plain', value: '\n' },
      { kind: 'line-start', value: 'Z' }, { kind: 'pair', value: 'ab' },
    ]],
    ['x', [{ kind: 'plain', value: 'x' }]],
    ['Zab', [{ kind: 'line-start', value: 'Z' }, { kind: 'pair', value: 'ab' }]],
    ['ab🙂ab', [
      { kind: 'pair', value: 'ab' }, { kind: 'plain', value: '🙂' },
      { kind: 'pair', value: 'ab' },
    ]],
  ];
  for (let i = 0; i < 5; i++) {
    for (const [source, expected] of fixtures) {
      const alias = i % 2 === 0 ? language.id : 'wave601-r';
      const actual = highlighter.tokenize(source, alias);
      assert.deepEqual(actual, expected);
      assert.equal(actual.map(token => token.value).join(''), source);
    }
  }
  assert.equal(expression.lastIndex, 50);
});
