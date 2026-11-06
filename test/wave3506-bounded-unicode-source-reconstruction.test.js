// Source-owned bounded differential regression: not native AttoLang execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('Unicode scanning is deterministic, source-conserving and caller-state independent', () => {
  const caller = /\p{Letter}+\p{Mark}*/uy;
  caller.lastIndex = 2;
  const grammar = createRegexLanguage({
    id: 'wave3506',
    tokens: [
      { kind: 'letters', pattern: caller },
      { kind: 'numbers', pattern: /\p{Number}+/u },
      { kind: 'markup', pattern: /[<&]/g },
    ],
  });
  // A reproducible bounded differential corpus, not a random or timing test.
  const atoms = ['A', 'β', '𝒜', '猫', '\u0301', '3', '٩', '🚀', '\r\n', '<', '&', ' ', '_'];
  let state = 0x35062026;
  for (let fixture = 0; fixture < 72; fixture++) {
    let input = '';
    for (let i = 0; i < 2 + fixture % 18; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      input += atoms[state % atoms.length];
    }
    const first = grammar.tokenize(input);
    assert.ok(first.every(record => record.value.length > 0), 'no zero-width tokens');
    assert.ok(first.every(record => ['plain', 'letters', 'numbers', 'markup'].includes(record.kind)));
    assert.equal(first.map(record => record.value).join(''), input);
    for (let round = 0; round < 4; round++) {
      assert.deepEqual(grammar.tokenize(input), first, 'grammar state must not leak between scans');
      assert.equal(caller.lastIndex, 2, 'caller-owned regex cursor must remain unchanged');
    }
  }
});
