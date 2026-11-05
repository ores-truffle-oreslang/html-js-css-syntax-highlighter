import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Source-owned tokenizer contract: no compiled AttoLang guest is exercised.
test('canonical and decomposed Unicode remain distinct while source UTF-8 round-trips', () => {
  const grammar = createRegexLanguage({
    id: 'wave1922-mixed-utf8',
    tokens: [
      { kind: 'astral', pattern: /💠/u },
      { kind: 'decomposed', pattern: /e\u0301/u },
      { kind: 'composed', pattern: /\u00e9/u },
      { kind: 'line', pattern: /\r\n/u },
      { kind: 'meta', pattern: /[<&]/u },
      { kind: 'nul', pattern: /\0/u },
    ],
  });
  const input = 'A💠e\u0301\u00e9\r\n<\0&💠B';
  const expected = [
    ['plain', 'A'], ['astral', '💠'], ['decomposed', 'e\u0301'],
    ['composed', '\u00e9'], ['line', '\r\n'], ['meta', '<'],
    ['nul', '\0'], ['meta', '&'], ['astral', '💠'], ['plain', 'B'],
  ];
  const encoder = new TextEncoder();
  const original = encoder.encode(input);
  for (let n = 0; n < 8; n++) {
    const tokens = grammar.tokenize(input);
    assert.deepEqual(tokens.map(({ kind, value }) => [kind, value]), expected);
    assert.deepEqual(encoder.encode(tokens.map(t => t.value).join('')), original);
    assert.ok(tokens.every(t => t.value.length > 0));
    assert.equal(grammar.tokenize('x\u00e9💠\r\n&').map(t => t.value).join(''), 'x\u00e9💠\r\n&');
  }
});
