import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('RegExp cursor and sticky flags remain caller-owned across alternating scalar inputs', () => {
  const caller = /HELLO/gy;
  caller.lastIndex = 4;
  const aliases = ['wave2141-hello-alias'];
  const rules = [
    {kind:'word', pattern:caller},
    {kind:'suffix', pattern:/LLO/g},
    {kind:'zero', pattern:/(?=HELLO)/g},
  ];
  const lang = createRegexLanguage({id:'wave2141-hello',aliases,tokens:rules});
  const inputs = [
    ['💠HELLO\r\nHELLO', [
      {kind:'plain', value:'💠'}, {kind:'word',value:'HELLO'},
      {kind:'plain',value:'\r\n'}, {kind:'word',value:'HELLO'},
    ]],
    ['HELLO☀️HELLO', [
      {kind:'word',value:'HELLO'}, {kind:'plain',value:'☀️'}, {kind:'word',value:'HELLO'},
    ]],
    ['🙂not matched', [{kind:'plain',value:'🙂not matched'}]],
  ];
  caller.lastIndex = 99;
  rules[0].kind = 'untrusted';
  aliases.push('late-added');
  for (let round=0; round<4; round++) {
    for (const [input,expected] of inputs) {
      assert.deepEqual(lang.tokenize(input),expected);
      assert.equal(lang.tokenize(input).map(t=>t.value).join(''),input);
      assert.equal(caller.lastIndex,99,'caller RegExp.lastIndex may not be mutated');
    }
  }
  assert.deepEqual(lang.aliases,['wave2141-hello-alias']);
});

test('leftmost then declaration-order priority survives earlier overlapping matches', () => {
  const lang=createRegexLanguage({id:'wave2141-priority',tokens:[
    {kind:'long',pattern:/aaaa/g},
    {kind:'short',pattern:/aa/g},
  ]});
  assert.deepEqual(lang.tokenize('🙂aaaa aa'),[
    {kind:'plain',value:'🙂'},{kind:'long',value:'aaaa'},
    {kind:'plain',value:' '},{kind:'short',value:'aa'},
  ]);
});
