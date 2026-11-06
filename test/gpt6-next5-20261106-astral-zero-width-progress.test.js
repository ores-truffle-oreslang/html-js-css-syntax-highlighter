import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/index.js';

test('zero-width lookahead before astral scalars cannot skip later nonempty matches', () => {
  const grammar = createRegexLanguage({
    id: 'next5-astral-guard',
    tokens: [{ kind: 'word', pattern: /(?=🦊)|TOKEN/u }]
  });
  const input = '🦊TOKEN🦊TOKEN';
  const expected = [
    { kind: 'plain', value: '🦊' },
    { kind: 'word', value: 'TOKEN' },
    { kind: 'plain', value: '🦊' },
    { kind: 'word', value: 'TOKEN' }
  ];
  assert.deepEqual(grammar.tokenize(input), expected);
  assert.deepEqual(grammar.tokenize(input), expected, 'regexp cursor is per call');
  assert.equal(grammar.tokenize(input).map(t => t.value).join(''), input);
});

test('all zero-width astral matches remain source-preserving and terminate', () => {
  const grammar = createRegexLanguage({
    id: 'next5-empty-only',
    tokens: [{ kind: 'noop', pattern: /(?=🦊)/u }]
  });
  for (const source of ['🦊🦊', 'A🦊B', '\r\n🦊', '']) {
    const tokens = grammar.tokenize(source);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.ok(tokens.every(t => t.kind === 'plain'),
      'empty regex matches must not be emitted');
  }
});
