// Host-only grammar regression: no compiled AttoLang guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('multiline anchors preserve UTF-16 and CRLF boundaries with case-insensitive rules', () => {
  const source = '🦊\r\nALPHA\r\nbeta!\nAlpha';
  const language = createRegexLanguage({id:'wave2331-anchors',tokens:[
    {kind:'heading',pattern:/^alpha$/i},
    {kind:'lower',pattern:/^beta/},
  ]});
  const expected = [
    {kind:'plain',value:'🦊\r\n'},
    {kind:'heading',value:'ALPHA'},
    {kind:'plain',value:'\r\n'},
    {kind:'lower',value:'beta'},
    {kind:'plain',value:'!\n'},
    {kind:'heading',value:'Alpha'},
  ];
  for (let i=0; i<5; i++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual,expected);
    assert.equal(actual.map(t=>t.value).join(''),source);
  }
});

test('a case-insensitive rule does not widen an unrelated case-sensitive rule',()=>{
  const lang=createRegexLanguage({id:'wave2331-flags',tokens:[
    {kind:'fold',pattern:/alpha/i},
    {kind:'exact',pattern:/BETA/},
  ]});
  const tokens=lang.tokenize('ALPHA beta BETA');
  assert.deepEqual(tokens,[
    {kind:'fold',value:'ALPHA'},
    {kind:'plain',value:' beta '},
    {kind:'exact',value:'BETA'},
  ]);
  assert.equal(tokens.map(t=>t.value).join(''),'ALPHA beta BETA');
});
