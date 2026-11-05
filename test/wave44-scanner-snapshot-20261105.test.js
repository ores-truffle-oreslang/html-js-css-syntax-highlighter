// Source-owned host tokenizer tests; not AttoLang compiler or guest proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

const scanner = createRegexLanguage({
  id: 'wave44-snapshot-scanner',
  tokens: [
    { kind: 'marker', pattern: /#/u },
    { kind: 'kanji', pattern: /猫/u },
  ],
});

test('mixed Unicode and punctuation reconstruct exact source without empty tokens', () => {
  for (const source of ['😀#猫\n😺#', 'plain\r\nline', '\0🙂#猫']) {
    const tokens = scanner.tokenize(source);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
  }
});

test('mutating a returned token cannot change the next tokenization', () => {
  const source = 'before#猫\nafter';
  const expected = scanner.tokenize(source);
  assert.ok(expected.length > 1);
  const damaged = scanner.tokenize(source);
  damaged[0].value = 'forged';
  damaged[0].kind = 'forged';
  damaged.push({ kind: 'fake', value: 'evil' });
  assert.deepEqual(scanner.tokenize(source), expected);
});
