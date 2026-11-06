import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

const language = createRegexLanguage({
  id:'wave9864-exhaustive',
  tokens:[
    {kind:'pair',pattern:/ab/},
    {kind:'letter',pattern:/a/},
    {kind:'emoji',pattern:/🥑/u},
    {kind:'digit',pattern:/0+/},
  ],
});

// Deliberately no RegExp in the reference lexer: a scalar-by-scalar source
// parser independently specifies leftmost priority and maximal zero runs.
function independentOracle(input) {
  const scalars = Array.from(input);
  const out = [];
  let plain = '';
  function token(kind, value) {
    if (plain) {out.push({kind:'plain',value:plain});plain='';}
    out.push({kind,value});
  }
  for (let i=0; i<scalars.length;) {
    if(scalars[i]==='a' && scalars[i+1]==='b') {
      token('pair','ab');i+=2;
    } else if(scalars[i]==='a') {
      token('letter','a');i++;
    } else if(scalars[i]==='🥑') {
      token('emoji','🥑');i++;
    } else if(scalars[i]==='0') {
      let end=i+1;
      while(end<scalars.length && scalars[end]==='0') end++;
      token('digit','0'.repeat(end-i));i=end;
    } else {
      plain+=scalars[i++];
    }
  }
  if(plain) out.push({kind:'plain',value:plain});
  return out;
}

test('781 input words of up to 4 Unicode scalars preserve exact tokens/source', () => {
  const alphabet=['a','b','🥑','0','&'];
  let total=0;
  let generation=[''];
  for(let length=0; length<=4; length++) {
    const following=[];
    for(const input of generation) {
      const expected=independentOracle(input);
      const actual=language.tokenize(input);
      assert.deepEqual(actual,expected,JSON.stringify(input));
      assert.equal(actual.map(t=>t.value).join(''),input);
      assert.ok(actual.every(t=>t.value.length>0));
      total++;
      for(const scalar of alphabet) following.push(input+scalar);
    }
    generation=following;
  }
  assert.equal(total,781);
});
