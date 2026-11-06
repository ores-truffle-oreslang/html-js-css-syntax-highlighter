// Independent collision oracle for zero-width assertions and overlapping rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('earliest match, construction priority and scalar progress remain deterministic', () => {
  const ci = /foo/i;
  const exact = /foo/;
  const dotall = /A.B/s;
  ci.lastIndex = 13;
  exact.lastIndex = 19;
  dotall.lastIndex = 23;
  const lang = createRegexLanguage({id:'wave2200b-rule-priority', tokens:[
    {kind:'zero',pattern:/(?=🙂)/},
    {kind:'ci',pattern:ci},
    {kind:'exact',pattern:exact},
    {kind:'dot',pattern:dotall},
    {kind:'emoji',pattern:/🙂/u},
  ]});
  const source = 'FOO foo A\nB 🙂\r\nend';
  const expected = [
    {kind:'ci',value:'FOO'},
    {kind:'plain',value:' '},
    {kind:'ci',value:'foo'},
    {kind:'plain',value:' '},
    {kind:'dot',value:'A\nB'},
    {kind:'plain',value:' '},
    {kind:'emoji',value:'🙂'},
    {kind:'plain',value:'\r\nend'},
  ];
  for(let i=0;i<20;i++){
    const result=lang.tokenize(source);
    assert.deepEqual(result,expected);
    assert.equal(result.map(x=>x.value).join(''),source);
    assert.equal(ci.lastIndex,13);
    assert.equal(exact.lastIndex,19);
    assert.equal(dotall.lastIndex,23);
  }
});
