// Source-owned lexer host regressions; not Oreslang parser/compiler execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('equal-position rule matches retain original grammar precedence',()=>{
  const language=createRegexLanguage({id:'wave37-rule-priority',tokens:[
    {kind:'first',pattern:/a+/},
    {kind:'second',pattern:/aa/},
  ]});
  assert.deepEqual(language.tokenize('aa aa'),[
    {kind:'first',value:'aa'}, {kind:'plain',value:' '},
    {kind:'first',value:'aa'}
  ]);
  assert.deepEqual(language.tokenize('aa'),[{kind:'first',value:'aa'}]);
});

test('unmatched Unicode is copied losslessly around bounded selected tokens',()=>{
  const language=createRegexLanguage({id:'wave37-unicode-source',tokens:[
    {kind:'letter',pattern:/A/},
  ]});
  const source='🦊<A&🌎';
  const tokens=language.tokenize(source);
  assert.deepEqual(tokens,[
    {kind:'plain',value:'🦊<'},{kind:'letter',value:'A'},
    {kind:'plain',value:'&🌎'}
  ]);
  assert.equal(tokens.map(token=>token.value).join(''),source);
});
