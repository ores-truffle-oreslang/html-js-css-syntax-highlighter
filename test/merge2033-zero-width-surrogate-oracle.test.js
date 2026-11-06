import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

// Source-level scanner test; not compilation or guest execution.
test('scanner makes bounded progress across Unicode scalars and empty matches', () => {
  const caller = /(?=Z)/gu;
  caller.lastIndex = 713;
  const lexer = createRegexLanguage({
    id: 'merge2033-zero-width',
    tokens: [
      {kind:'empty',pattern:caller},
      {kind:'astral',pattern:/💠/u},
      {kind:'crlf',pattern:/\r\n/u},
      {kind:'nul',pattern:/\u0000/u},
      {kind:'z',pattern:/Z/u},
      {kind:'two',pattern:/ab/u},
    ],
  });
  const samples = ['', '💠Z\r\nab\u0000', '\uD800Z\uDC00', '💠💠ZZ', 'x\r\n💠Z'];
  let seed = 0x735d8b21;
  const alphabet = ['Z', '💠', '\r\n', 'ab', '\u0000', 'x', '<', '\uD800', '\uDC00'];
  for (let i=0;i<96;i++) {
    let sample='';
    for (let j=0;j<12;j++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      sample+=alphabet[seed%alphabet.length];
    }
    samples.push(sample);
  }
  for(const source of samples){
    const one=lexer.tokenize(source);
    const two=lexer.tokenize(source);
    assert.deepEqual(two,one,'replaying one grammar instance must be deterministic');
    assert.equal(one.map(t=>t.value).join(''),source,'all UTF-16 code units conserved');
    assert.ok(one.every(t=>t.value.length>0),'empty regex must not emit empty tokens');
    assert.ok(one.length<=source.length,'nonempty tokens bounded by source length');
    assert.ok(one.every(t=>t.kind!=='empty'));
  }
  assert.equal(caller.lastIndex,713,'caller regex cursor may not be mutated');
});

test('overlapping consumption is stable at one position after astral and CRLF prefixes',()=>{
  const language=createRegexLanguage({id:'merge2033-tie',tokens:[
    {kind:'short',pattern:/Z/u},{kind:'pair',pattern:/ZZ/u},{kind:'line',pattern:/\r\n/u}
  ]});
  const source='💠\r\nZZ';
  assert.deepEqual(language.tokenize(source),[
    {kind:'plain',value:'💠'}, {kind:'line',value:'\r\n'},
    {kind:'short',value:'Z'}, {kind:'short',value:'Z'}
  ]);
});
