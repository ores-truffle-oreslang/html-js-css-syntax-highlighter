import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Source-owned host tokenizer regression, not an AttoLang guest compiler test.
test('zero-width matches cannot swallow later consuming Unicode/CRLF tokens', () => {
  const grammar = createRegexLanguage({id: 'wave1511-zero-width', tokens: [
    {kind: 'empty', pattern: /(?=x)/},
    {kind: 'x', pattern: /x/g},
    {kind: 'line', pattern: /\r\n/},
    {kind: 'aster', pattern: /💠/u},
  ]});
  const source = '💠x\r\nx!💠';
  const expected = [
    {kind:'aster',value:'💠'},
    {kind:'x',value:'x'},
    {kind:'line',value:'\r\n'},
    {kind:'x',value:'x'},
    {kind:'plain',value:'!'},
    {kind:'aster',value:'💠'},
  ];
  for (let i = 0; i < 4; i++) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
  }
});

test('caller regex cursors do not cross independent grammar invocations', () => {
  const regex = /x/gy;
  regex.lastIndex = 7000;
  const grammar = createRegexLanguage({id:'wave1511-cursor',tokens:[{kind:'x',pattern:regex}]});
  const sources = ['💠x', 'x💠x', 'plain', 'x'];
  const partitions = [['plain','x'],['x','plain','x'],['plain'],['x']];
  for (let i=0;i<12;i++) {
    const index=i % sources.length;
    const out=grammar.tokenize(sources[index]);
    assert.deepEqual(out.map(x=>x.kind), partitions[index]);
    assert.equal(out.map(x=>x.value).join(''),sources[index]);
    assert.equal(regex.lastIndex,7000);
  }
});
