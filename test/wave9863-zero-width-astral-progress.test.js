import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('zero-width lookaheads cannot steal or loop on astral scalar matches', () => {
  const empty = /(?=🥑)/u;
  empty.lastIndex = 19;
  const language = createRegexLanguage({
    id:'wave9863-astral-progress',
    tokens:[
      {kind:'empty',pattern:empty},
      {kind:'emoji',pattern:/🥑/u},
    ],
  });
  const cases=[
    {source:'🥑x🥑',expected:[
      {kind:'emoji',value:'🥑'},
      {kind:'plain',value:'x'},
      {kind:'emoji',value:'🥑'},
    ]},
    {source:'🥑🥑',expected:[{kind:'emoji',value:'🥑'},{kind:'emoji',value:'🥑'}]},
    {source:'x',expected:[{kind:'plain',value:'x'}]},
    {source:'',expected:[]},
  ];
  for(let round=0;round<25;round++) {
    for(const {source,expected} of cases) {
      const got=language.tokenize(source);
      assert.deepEqual(got,expected);
      assert.equal(got.map(t=>t.value).join(''),source);
      assert.ok(got.every(t=>t.kind!=='empty'&&t.value.length>0));
      assert.equal(empty.lastIndex,19,'caller regex cursor must be owned by caller');
    }
  }
});
