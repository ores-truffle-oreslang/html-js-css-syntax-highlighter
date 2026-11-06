import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('registration snapshots shared RegExp, category and aliases across interleaved Unicode calls', () => {
  const shared = /a🙂/gi;
  shared.lastIndex = 17;
  const rules = [
    {kind:'long', pattern:shared},
    {kind:'short', pattern:/a/i},
  ];
  const aliases = ['source-alias'];
  const first = createRegexLanguage({id:'source-first', aliases, tokens:rules});
  const second = createRegexLanguage({id:'source-second', tokens:[
    {kind:'alternative-long',pattern:shared}, {kind:'alternative-short',pattern:/a/i},
  ]});
  const highlighter = new SyntaxHighlighter({languages:[first, second]});
  rules[0].kind='untrusted-renamed';
  rules[0].pattern=/./;
  rules[1].kind='untrusted-second';
  aliases[0]='untrusted-alias';
  shared.lastIndex=999;
  const source = 'a🙂\r\nA X a';
  const expected = [
    {kind:'long',value:'a🙂'},
    {kind:'plain',value:'\r\n'},
    {kind:'short',value:'A'},
    {kind:'plain',value:' X '},
    {kind:'short',value:'a'},
  ];
  const alternateExpected=expected.map(token => token.kind === 'long'
    ? {...token,kind:'alternative-long'} : token.kind === 'short'
      ? {...token,kind:'alternative-short'} : token);
  for(let pass=0;pass<12;pass++){
    assert.deepEqual(highlighter.tokenize(source,'source-alias'),expected);
    assert.deepEqual(highlighter.tokenize(source,'source-second'),alternateExpected);
    assert.equal(highlighter.tokenize(source,'source-first').map(t=>t.value).join(''),source);
    assert.equal(shared.lastIndex,999, 'the caller RegExp cursor must be left unchanged');
  }
  assert.equal(highlighter.language('untrusted-alias'),undefined);
  assert.equal(highlighter.language('source-alias'),first);
});