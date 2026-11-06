import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Host tokenizer contract only; never claim compiler-backed AttoLang parity.
test('overlapping rules resolve by source position and declaration order, preserving UTF-8', () => {
  const grammar = createRegexLanguage({ id: 'wave2032-astral-priority', tokens: [
    { kind: 'astral', pattern: /💠/u },
    { kind: 'short', pattern: /x/u },
    { kind: 'long', pattern: /xy/u },
    { kind: 'break', pattern: /\r\n/u },
  ]});
  const input = '💠xy\r\n💠x!💠xy';
  const expected = [
    ['astral', '💠'], ['short', 'x'], ['plain', 'y'],
    ['break', '\r\n'], ['astral', '💠'], ['short', 'x'],
    ['plain', '!'], ['astral', '💠'], ['short', 'x'], ['plain', 'y'],
  ];
  const sourceBytes = new TextEncoder().encode(input);
  for (let i = 0; i < 12; i++) {
    const result = grammar.tokenize(input);
    assert.deepEqual(result.map(({kind, value}) => [kind, value]), expected);
    assert.deepEqual(new TextEncoder().encode(result.map(token => token.value).join('')), sourceBytes);
    assert.equal(result.some(token => token.value.length === 0), false);
    assert.equal(grammar.tokenize('💠\r\n').map(x => x.value).join(''), '💠\r\n');
  }
});

test('multiline beginning-of-line pattern admits only true line boundaries', () => {
  const grammar = createRegexLanguage({ id: 'wave2032-multiline', tokens: [
    {kind: 'line-marker', pattern: /^💠/m},
    {kind: 'break', pattern: /\r\n/},
  ]});
  assert.deepEqual(grammar.tokenize('x💠\r\n💠\r\nz💠').map(x => [x.kind,x.value]), [
    ['plain','x💠'], ['break','\r\n'], ['line-marker','💠'],
    ['break','\r\n'], ['plain','z💠'],
  ]);
});
