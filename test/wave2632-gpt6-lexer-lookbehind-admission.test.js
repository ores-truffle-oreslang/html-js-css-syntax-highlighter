// Host lexer regression: lookbehind is admitted only at the matching source location.
// A zero-width probe must never create an empty token or consume an astral scalar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

const grammar = createRegexLanguage({
  id: 'wave2632-lookbehind',
  tokens: [
    { kind: 'probe', pattern: /(?=X)/u },
    { kind: 'guarded', pattern: /(?<=🧪)X/u },
    { kind: 'other', pattern: /X/u },
  ],
});

function reference(source) {
  const out = [];
  let cursor = 0;
  for (const match of source.matchAll(/X/g)) {
    const at = match.index;
    if (at > cursor) out.push({kind: 'plain', value: source.slice(cursor, at)});
    out.push({kind: source.slice(0, at).endsWith('🧪') ? 'guarded' : 'other', value: 'X'});
    cursor = at + 1;
  }
  if (cursor < source.length) out.push({kind: 'plain', value: source.slice(cursor)});
  return out;
}

test('lookbehind and zero-width probes preserve exact Unicode and CRLF partitions', () => {
  const cases = [
    '🧪X\r\n😺X&<', 'X🧪X\0X', '🧪X🧪X', '\r\n😺X', '', 'X', '🧪X\r\nX🧪X',
  ];
  for (const source of cases) {
    for (let repetition = 0; repetition < 4; repetition++) {
      const tokens = grammar.tokenize(source);
      assert.deepEqual(tokens, reference(source), 'source ' + JSON.stringify(source));
      assert.equal(tokens.map(x => x.value).join(''), source);
      assert.ok(tokens.every(x => x.value.length > 0 && x.kind !== 'probe'));
    }
  }
});
