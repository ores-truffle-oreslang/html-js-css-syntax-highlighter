// Source-owned Unicode lexical boundaries; no compiler guest parity claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('zero-width lookahead never consumes astral symbols or following source gaps', () => {
  const language = createRegexLanguage({ id: 'wave321-zero-width', tokens: [
    { kind: 'inert', pattern: /(?=💠)/u },
    { kind: 'symbol', pattern: /💠/u },
    { kind: 'word', pattern: /ab/ },
  ] });
  const code = 'x💠ab\rY💠ab\n';
  const expected = [
    { kind: 'plain', value: 'x' }, { kind: 'symbol', value: '💠' },
    { kind: 'word', value: 'ab' }, { kind: 'plain', value: '\rY' },
    { kind: 'symbol', value: '💠' }, { kind: 'word', value: 'ab' },
    { kind: 'plain', value: '\n' },
  ];
  for (let n = 0; n < 4; n++) {
    const tokens = language.tokenize(code);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), code);
    assert.ok(tokens.every(token => token.kind !== 'inert'));
  }
});

test('overlapping rules choose earliest source position before rule priority', () => {
  const language = createRegexLanguage({ id: 'wave321-source-position', tokens: [
    { kind: 'later', pattern: /ab/ },
    { kind: 'earlier', pattern: /💠/u },
  ] });
  assert.deepEqual(language.tokenize('💠ab'), [
    { kind: 'earlier', value: '💠' }, { kind: 'later', value: 'ab' },
  ]);
});
