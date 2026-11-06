// Deterministic, separate indexOf oracle for simple literal regex rules.
// Host lexer evidence only; no guest compiler or AOT parity implied.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

const entries = [['pair','ab'],['single','a'],['astral','💠'],['line','\r\n']];
function oracle(source) {
  const out = [];
  let cursor = 0;
  while (cursor < source.length) {
    let best = null;
    for (const [kind, literal] of entries) {
      const at = source.indexOf(literal, cursor);
      if (at >= 0 && (!best || at < best.at)) best = {kind,literal,at};
    }
    if (!best) {
      out.push({ kind:'plain', value:source.slice(cursor) });
      break;
    }
    if (best.at > cursor) out.push({kind:'plain',value:source.slice(cursor,best.at)});
    out.push({kind:best.kind,value:best.literal});
    cursor = best.at + best.literal.length;
  }
  return out;
}

test('overlapping, empty-lookahead and astral rules agree with independent oracle', () => {
  const pair=/ab/g;
  const single=/a/gi;
  const astral=/💠/u;
  const line=/\r\n/;
  const zero=/(?=a)/u; // zero-width must never produce a token.
  pair.lastIndex=3;
  single.lastIndex=7;
  const grammar=createRegexLanguage({
    id:'wave2045-literal',
    tokens:[
      {kind:'pair',pattern:pair},
      {kind:'single',pattern:/a/},
      {kind:'astral',pattern:astral},
      {kind:'line',pattern:line},
      {kind:'zero',pattern:zero},
    ]
  });
  const alphabet=['a','b','q','💠','\r','\n','0','<','😺','\u2028'];
  let seed=0x2045cafe;
  const next=()=>{
    seed ^= seed<<13;
    seed ^= seed>>>17;
    seed ^= seed<<5;
    return seed>>>0;
  };
  for(let sample=0;sample<240;sample++){
    let source='';
    const count=next()%42;
    for(let i=0;i<count;i++)source+=alphabet[next()%alphabet.length];
    const expected=oracle(source);
    for(let replay=0;replay<3;replay++){
      const actual=grammar.tokenize(source);
      assert.deepEqual(actual,expected,'sample '+sample+' replay '+replay);
      assert.equal(actual.map(t=>t.value).join(''),source);
      assert.ok(actual.every(t=>t.value.length>0 && t.kind!=='zero'));
    }
  }
  assert.equal(pair.lastIndex,3);
  assert.equal(single.lastIndex,7);
  assert.equal(astral.lastIndex,0);
  assert.equal(line.lastIndex,0);
  assert.equal(zero.lastIndex,0);
});

test('earliest source index wins; first registered rule breaks equal-index ties', () => {
  const grammar=createRegexLanguage({id:'wave2045-ties',
    tokens:[{kind:'pair',pattern:/ab/},{kind:'other',pattern:/ab/},
      {kind:'single',pattern:/a/}]});
  assert.deepEqual(grammar.tokenize('cababa'),[
    {kind:'plain',value:'c'},
    {kind:'pair',value:'ab'},
    {kind:'pair',value:'ab'},
    {kind:'single',value:'a'},
  ]);
});
