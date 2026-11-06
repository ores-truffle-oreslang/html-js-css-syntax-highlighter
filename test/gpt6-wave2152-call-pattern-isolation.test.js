import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('compiled grammar snapshots caller regexes and resolves equal-position priority', () => {
  const callerPattern = /ab/gi;
  const tokenRules = [
    {kind:'pair', pattern:callerPattern},
    {kind:'single', pattern:/a/gi},
    {kind:'emoji', pattern:/🙂/u},
    {kind:'newline', pattern:/\r\n/},
  ];
  const aliases = ['original-alias'];
  const grammar = createRegexLanguage({id:'snapshot2152',aliases,tokens:tokenRules});
  const h = new SyntaxHighlighter({languages:[grammar]});
  callerPattern.lastIndex = 45;
  tokenRules[0].kind = 'tampered';
  tokenRules[0].pattern = /x/g;
  tokenRules[1].kind = 'tampered-single';
  aliases[0] = 'hijacked-alias';

  const source = 'AB🙂\r\nab a';
  const expected = [
    {kind:'pair',value:'AB'},
    {kind:'emoji',value:'🙂'},
    {kind:'newline',value:'\r\n'},
    {kind:'pair',value:'ab'},
    {kind:'plain',value:' '},
    {kind:'single',value:'a'},
  ];
  for (let iteration = 0; iteration < 16; iteration++) {
    assert.deepEqual(h.tokenize(source,'snapshot2152'),expected);
    assert.deepEqual(h.tokenize(source,'original-alias'),expected);
    assert.equal(h.tokenize(source,'snapshot2152').map(t=>t.value).join(''),source);
    assert.equal(callerPattern.lastIndex,45,'caller RegExp cursor must never be rewritten');
  }
  assert.equal(h.language('hijacked-alias'),undefined);
  assert.equal(h.language('original-alias'),grammar);
});

test('alternate Unicode and CRLF inputs cannot leak a previous lexer cursor', () => {
  const grammar=createRegexLanguage({id:'alternate2152',tokens:[
    {kind:'pair',pattern:/ab/i},
    {kind:'newline',pattern:/\r\n/},
    {kind:'face',pattern:/🙂/u},
  ]});
  const inputs=['ab🙂\r\n','🙂XXab','\r\nAB','', '🙂🙂ab'];
  const expectedParts=[
    ['ab','🙂','\r\n'],
    ['🙂','XX','ab'],
    ['\r\n','AB'],
    [],
    ['🙂','🙂','ab'],
  ];
  for(let pass=0;pass<12;pass++) for(let i=0;i<inputs.length;i++){
    const actual=grammar.tokenize(inputs[i]);
    assert.deepEqual(actual.map(t=>t.value),expectedParts[i]);
    assert.equal(actual.map(t=>t.value).join(''),inputs[i]);
  }
});
