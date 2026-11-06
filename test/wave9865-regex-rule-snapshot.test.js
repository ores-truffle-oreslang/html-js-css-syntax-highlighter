import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('registered RegExp flags, source and kinds remain stable under caller mutation', () => {
  const foldPattern=/ab/i;
  const dotPattern=/x.y/s;
  foldPattern.lastIndex=19;
  dotPattern.lastIndex=23;
  const first={kind:'folded',pattern:foldPattern};
  const second={kind:'dotall',pattern:dotPattern};
  const rules=[first,second];
  const language=createRegexLanguage({id:'wave9865-flags',tokens:rules});

  first.kind='mutated';
  first.pattern=/not-used/;
  second.kind='mutated';
  second.pattern=/not-used/;
  rules.splice(0,rules.length,{kind:'bad',pattern:/evil/});

  const source='AB x\ny';
  const expected=[
    {kind:'folded',value:'AB'},
    {kind:'plain',value:' '},
    {kind:'dotall',value:'x\ny'},
  ];
  for(let round=0;round<30;round++) {
    const tokens=language.tokenize(source);
    assert.deepEqual(tokens,expected);
    assert.equal(tokens.map(token=>token.value).join(''),source);
    assert.equal(foldPattern.lastIndex,19);
    assert.equal(dotPattern.lastIndex,23);
  }
  assert.deepEqual(language.tokenize('ab'),[{kind:'folded',value:'ab'}]);
  assert.deepEqual(language.tokenize('X\ny'),[{kind:'plain',value:'X\ny'}]);
});
