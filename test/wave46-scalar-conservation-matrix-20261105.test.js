// Host-only tokenizer metamorphic check; no compiler-backed AttoLang proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('mixed scalar widths, zero-width probes and overlapping rules conserve every source code unit', () => {
  const language = createRegexLanguage({
    id: 'wave46-scalar-conservation',
    tokens: [
      {kind: 'zero', pattern: /(?=😀)/u},
      {kind: 'latin', pattern: /[A-Z]+/u},
      {kind: 'unicode', pattern: /\p{L}+/u},
      {kind: 'digits', pattern: /\d+/u},
      {kind: 'emoji', pattern: /[😀🙂]/u},
    ],
  });
  for (const source of [
    '', '😀', '🙂', 'A😀B', '😀ABC,Qué💡DEF', 'a🙂b\n', '\n😀\n',
    'a😀😀b', '1🙂2😀3', '汉字 ABC 🙂', '<tag>😀&</tag>',
  ]) {
    const tokens = language.tokenize(source);
    assert.equal(tokens.map(token => token.value).join(''), source, source);
    assert.ok(tokens.every(token => token.value.length > 0), source);
    assert.ok(tokens.every(token => token.kind !== 'zero'), source);
    assert.deepEqual(language.tokenize(source), tokens, source);
  }
});
