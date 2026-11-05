// Host-side Unicode scanner regression; no AttoLang compiler or guest execution claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('zero-width token patterns never consume or split astral source scalars', () => {
  const grammar = createRegexLanguage({
    id: 'wave42-unicode-snapshot',
    tokens: [
      { kind: 'zero', pattern: /(?:)/u },
      { kind: 'word', pattern: /猫/u },
    ],
  });
  const source = '😀猫\n😺';
  const tokens = grammar.tokenize(source);
  assert.deepEqual(tokens, [
    { kind: 'plain', value: '😀' },
    { kind: 'word', value: '猫' },
    { kind: 'plain', value: '\n😺' },
  ]);
  assert.equal(tokens.map(token => token.value).join(''), source);
  assert.ok(tokens.every(token => token.value.length > 0));
});

test('pure zero-width grammar preserves the whole input without invented tokens', () => {
  const grammar = createRegexLanguage({
    id: 'wave42-empty-only',
    tokens: [{ kind: 'empty', pattern: /(?:)/u }],
  });
  for (const source of ['', '🙂', 'a\n🙂\nb']) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, source ? [{ kind: 'plain', value: source }] : []);
  }
});
