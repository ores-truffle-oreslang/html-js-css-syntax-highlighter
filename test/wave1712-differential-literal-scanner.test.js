// Independent deterministic host oracle for leftmost literal grammar semantics.
// This is not compiler-backed AttoLang guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

const entries = [
  ['pair', 'ab', /ab/],
  ['single-a', 'a', /a/],
  ['single-b', 'b', /b/],
  ['astral', '💠', /💠/u],
  ['newline', '\r\n', /\r\n/],
  ['left', '<', /</],
  ['amp', '&', /&/],
  ['nul', '\0', /\0/],
];

function reference(source) {
  const expected = [];
  let cursor = 0;
  while (cursor < source.length) {
    let winner = null;
    for (const [kind, literal] of entries) {
      const at = source.indexOf(literal, cursor);
      if (at !== -1 && (winner === null || at < winner.at)) {
        winner = { kind, literal, at };
      }
    }
    if (winner === null) {
      expected.push({ kind: 'plain', value: source.slice(cursor) });
      break;
    }
    if (winner.at > cursor) {
      expected.push({ kind: 'plain', value: source.slice(cursor, winner.at) });
    }
    expected.push({ kind: winner.kind, value: winner.literal });
    cursor = winner.at + winner.literal.length;
  }
  return expected;
}

test('seeded literal scanner exactly agrees with separate indexOf oracle', () => {
  const tokens = entries.map(([kind, _literal, pattern]) => ({ kind, pattern }));
  const grammar = createRegexLanguage({ id: 'wave1712-oracle', tokens });
  const alphabet = ['a', 'b', 'c', '💠', '\r', '\n', '<', '&', '\0', '😺', "'"];
  let seed = 0x7fa2de1;
  const next = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return seed >>> 0;
  };
  for (let sample = 0; sample < 240; sample++) {
    let source = '';
    const count = next() % 34;
    for (let j = 0; j < count; j++) source += alphabet[next() % alphabet.length];
    for (let repeat = 0; repeat < 3; repeat++) {
      const actual = grammar.tokenize(source);
      assert.deepEqual(actual, reference(source), 'sample ' + sample);
      assert.equal(actual.map(item => item.value).join(''), source);
      assert.ok(actual.every(item => item.value.length > 0));
    }
  }
});

test('longest earlier literal wins; tie is stable by rule order', () => {
  const grammar = createRegexLanguage({
    id: 'wave1712-ties',
    tokens: [
      {kind: 'earlier', pattern: /ab/},
      {kind: 'later', pattern: /a/},
      {kind: 'equal', pattern: /ab/},
    ],
  });
  assert.deepEqual(grammar.tokenize('zababa'), [
    {kind:'plain', value:'z'}, {kind:'earlier',value:'ab'},
    {kind:'earlier',value:'ab'}, {kind:'later',value:'a'},
  ]);
});
