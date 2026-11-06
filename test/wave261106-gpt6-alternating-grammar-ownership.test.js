import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Source-owned host regression only; no compiled AttoLang guest is involved.
test('alternating Unicode/CRLF sources never mutate caller RegExp state', () => {
  const original = /(?:return|throw)/gi;
  original.lastIndex = 71;
  const rules = [
    {kind: 'keyword', pattern: original},
    {kind: 'emoji', pattern: /💠/u},
    {kind: 'newline', pattern: /\r\n/},
    {kind: 'zero', pattern: /(?=return)/},
  ];
  const grammar = createRegexLanguage({id: 'wave261106-grammar', tokens: rules});
  const fixtures = [
    ['💠return\r\nTHROW & 💠throw', ['emoji','keyword','newline','keyword','plain','emoji','keyword']],
    ['THROW💠', ['keyword','emoji']],
    ['no match', ['plain']],
    ['return\r\n💠return', ['keyword','newline','emoji','keyword']],
    ['', []],
  ];
  rules[0].kind = 'altered-by-caller';
  for (let iteration = 0; iteration < 20; iteration++) {
    for (const [source, kinds] of fixtures) {
      const tokens = grammar.tokenize(source);
      assert.deepEqual(tokens.map(t => t.kind), kinds);
      assert.equal(tokens.map(t => t.value).join(''), source);
      assert.ok(tokens.every(t => t.value.length > 0));
      assert.equal(grammar.tokenize(source).map(t => t.value).join(''), source);
    }
    assert.equal(original.lastIndex, 71);
  }
});
