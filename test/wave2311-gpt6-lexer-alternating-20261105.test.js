import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Host-only lexer regression; this does not execute a compiled AttoLang guest.
test('one compiled grammar preserves exact source across alternating inputs', () => {
  const original = /x/gy;
  original.lastIndex = 37;
  const grammar = createRegexLanguage({id:'wave2311-alternating', tokens:[
    {kind:'word', pattern:original},
    {kind:'line', pattern:/\r\n/},
    {kind:'symbol', pattern:/💠/u},
    {kind:'probe', pattern:/(?=x)/},
  ]});
  const cases = [
    ['💠x\r\nx!', ['symbol','word','line','word','plain']],
    ['x\n💠', ['word','plain','symbol']],
    ['\r\n💠\r\n', ['line','symbol','line']],
    ['plain', ['plain']],
    ['', []],
  ];
  for (let round=0;round<16;round++) {
    for (const [source, expectedKinds] of cases) {
      const tokens=grammar.tokenize(source);
      assert.deepEqual(tokens.map(token=>token.kind),expectedKinds);
      assert.equal(tokens.map(token=>token.value).join(''),source);
      assert.ok(tokens.every(token=>token.value.length>0));
    }
    assert.equal(original.lastIndex,37,'caller-owned regular expression was mutated');
  }
});
