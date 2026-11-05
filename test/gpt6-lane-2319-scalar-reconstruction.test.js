import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

const language = createRegexLanguage({id:'scalar-reconstruction',tokens:[
  {kind:'ident',pattern:/[A-Za-z_]+/},
  {kind:'number',pattern:/[0-9]+/},
  {kind:'break',pattern:/\r\n|\n|\r/},
  {kind:'operator',pattern:/[!?&<>=]+/}
]});

test('tokenization reconstructs hostile Unicode and CRLF source without gaps',()=>{
  const corpus=['', 'alpha 12\r\n', '🙂a\u0301\r\nx', '\ud800abc\udc00', '<&"\'x\0y','👩‍💻_12\t😺\r\nend'];
  let seed=0x4a9d;
  const chars=['a','X','1','_',' ','\r','\n','🙂','\u0301','&','<','\0'];
  let generated='';
  for(let i=0;i<300;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    generated+=chars[seed%chars.length];
  }
  corpus.push(generated);
  for(const source of corpus){
    const tokens=language.tokenize(source);
    assert.equal(tokens.map(x=>x.value).join(''),source);
    assert.ok(tokens.every(x=>x.value.length>0));
    assert.deepEqual(language.tokenize(source),tokens);
  }
});
