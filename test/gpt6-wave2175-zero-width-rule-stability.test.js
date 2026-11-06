import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('zero-width lookbehind/lookahead never consume Unicode source or leak cursors',()=>{
  const original=/A/gi;
  const lexer=createRegexLanguage({id:'wave2175-zero-width',tokens:[
    {kind:'never',pattern:/(?=A)/i},
    {kind:'never',pattern:/(?<=🙂)/u},
    {kind:'face',pattern:/🙂/u},
    {kind:'letter',pattern:original},
    {kind:'newline',pattern:/\r\n/},
  ]});
  original.lastIndex=99;
  const source='🙂A\r\n🙂a';
  const expected=[
    {kind:'face',value:'🙂'},
    {kind:'letter',value:'A'},
    {kind:'newline',value:'\r\n'},
    {kind:'face',value:'🙂'},
    {kind:'letter',value:'a'},
  ];
  for(let pass=0;pass<20;pass++){
    assert.deepEqual(lexer.tokenize(source),expected);
    assert.deepEqual(lexer.tokenize('A'),[{kind:'letter',value:'A'}]);
    assert.equal(original.lastIndex,99,'caller RegExp must remain untouched');
    assert.equal(lexer.tokenize(source).map(x=>x.value).join(''),source);
  }
});

test('per-rule case and dotAll flags remain independent under repeated scans',()=>{
  const lexer=createRegexLanguage({id:'wave2175-flags',tokens:[
    {kind:'sensitive',pattern:/Ab/},
    {kind:'insensitive',pattern:/ab/i},
    {kind:'across-lines',pattern:/x.y/s},
    {kind:'fallback',pattern:/a/},
  ]});
  const source='ab Ab x\ny';
  const expected=[
    {kind:'insensitive',value:'ab'},
    {kind:'plain',value:' '},
    {kind:'sensitive',value:'Ab'},
    {kind:'plain',value:' '},
    {kind:'across-lines',value:'x\ny'},
  ];
  for(let i=0;i<20;i++)assert.deepEqual(lexer.tokenize(source),expected);
});
