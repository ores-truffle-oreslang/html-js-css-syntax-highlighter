// Host contract: multiline anchors, astral tokens and zero-width probes partition source.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('anchored Unicode rules preserve every CRLF byte and code point', () => {
  const grammar = createRegexLanguage({
    id: 'wave261106b-unicode-anchored',
    tokens: [
      { kind: 'zero', pattern: /(?=😀)/u },
      { kind: 'word', pattern: /^\p{L}+/u },
      { kind: 'emoji', pattern: /😀/u },
    ],
  });
  const source = 'α\r\n😀-β\nΓ';
  const expected = [
    {kind:'word', value:'α'},
    {kind:'plain', value:'\r\n'},
    {kind:'emoji', value:'😀'},
    {kind:'plain', value:'-β\n'},
    {kind:'word', value:'Γ'},
  ];
  for (let i=0; i<3; i++) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(t=>t.value).join(''), source);
    assert.ok(tokens.every(t=>t.value.length>0));
  }
});
