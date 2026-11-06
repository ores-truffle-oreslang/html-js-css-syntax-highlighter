import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Source-owned differential flag test, not compiled AttoLang execution.
test('ignoreCase and dotAll are isolated to each rule under repeated scans', () => {
  const caseless = /cat/i;
  caseless.lastIndex = 29;
  const lexer = createRegexLanguage({
    id: 'wave2031-flags',
    tokens: [
      { kind: 'cat', pattern: caseless },
      { kind: 'dog', pattern: /dog/ },
      { kind: 'multiline', pattern: /A.B/s },
      { kind: 'emoji', pattern: /😀/u },
      { kind: 'zero-width', pattern: /(?=cat)/ },
    ],
  });
  const fixtures = [
    {
      source: 'CAT\rdog\nA\nB😀DOGcat',
      expected: [
        { kind: 'cat', value: 'CAT' },
        { kind: 'plain', value: '\r' },
        { kind: 'dog', value: 'dog' },
        { kind: 'plain', value: '\n' },
        { kind: 'multiline', value: 'A\nB' },
        { kind: 'emoji', value: '😀' },
        { kind: 'plain', value: 'DOG' },
        { kind: 'cat', value: 'cat' },
      ],
    },
    { source: 'D\nG', expected: [{ kind: 'plain', value: 'D\nG' }] },
    { source: 'cAt😀', expected: [{ kind: 'cat', value: 'cAt' },
      { kind: 'emoji', value: '😀' }] },
    { source: '', expected: [] },
  ];
  for (let iteration = 0; iteration < 24; iteration++) {
    for (const { source, expected } of fixtures) {
      const tokens = lexer.tokenize(source);
      assert.deepEqual(tokens, expected);
      assert.equal(tokens.map(t => t.value).join(''), source);
      assert.ok(tokens.every(t => t.value.length > 0));
    }
    assert.equal(caseless.lastIndex, 29);
  }
});
