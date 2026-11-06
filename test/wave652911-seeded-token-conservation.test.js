import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('seeded scanner agrees with independent earliest-match oracle and retains all source', () => {
  const original = /atto/ig;
  original.lastIndex = 37;
  const patterns = [/atto/giu, /[0-9]+/gu, /🧠/gu];
  const kinds = ['word', 'integer', 'emoji'];
  const language = createRegexLanguage({
    id: 'wave652911-seeded',
    tokens: [{kind: kinds[0], pattern: original},
      {kind: kinds[1], pattern: patterns[1]},
      {kind: kinds[2], pattern: patterns[2]}],
  });
  function oracle(source) {
    const result = [];
    let at = 0;
    while (at < source.length) {
      let chosen = null;
      for (let i = 0; i < patterns.length; i++) {
        const expr = new RegExp(patterns[i].source, patterns[i].flags);
        expr.lastIndex = at;
        const m = expr.exec(source);
        if (m && (!chosen || m.index < chosen.match.index))
          chosen = {i, match: m};
      }
      if (!chosen) {
        result.push({kind: 'plain', value: source.slice(at)});
        break;
      }
      if (chosen.match.index > at)
        result.push({kind: 'plain', value: source.slice(at, chosen.match.index)});
      result.push({kind: kinds[chosen.i], value: chosen.match[0]});
      at = chosen.match.index + chosen.match[0].length;
    }
    return result;
  }
  const parts = ['a', 't', 'to', 'ATTO', '🧠', '19', '2', '\r\n', '<', '&', ' '];
  let seed = 0x6a1ef1;
  for (let caseId = 0; caseId < 64; caseId++) {
    const segments = [];
    for (let j = 0; j < 48; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      segments.push(parts[seed % parts.length]);
    }
    const source = segments.join('');
    const expected = oracle(source);
    for (let repeat = 0; repeat < 3; repeat++) {
      const actual = language.tokenize(source);
      assert.deepEqual(actual, expected, 'corpus case ' + caseId);
      assert.equal(actual.map(token => token.value).join(''), source);
      assert.equal(original.lastIndex, 37);
    }
  }
});
