import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('same language owner may register aliases repeatedly without losing ownership',()=>{
  const owner=createRegexLanguage({
    id:'wave2143-language',aliases:['__proto__','constructor'],
    tokens:[{kind:'word',pattern:/token/}]
  });
  const engine=new SyntaxHighlighter({languages:[owner]});
  assert.equal(engine.use(owner),engine);
  for(const key of [owner.id,...owner.aliases]){
    assert.equal(engine.language(key),owner);
    assert.deepEqual(engine.tokenize('token',key),[{kind:'word',value:'token'}]);
  }
  const hostile=createRegexLanguage({
    id:'wave2143-foreign',aliases:['constructor','new-alias'],
    tokens:[{kind:'foreign',pattern:/token/}]
  });
  assert.throws(()=>engine.use(hostile),/registration conflict/);
  assert.equal(engine.language('new-alias'),undefined,'rejected plugin must not partially register');
  assert.equal(engine.language('constructor'),owner);
  assert.equal(engine.language(owner.id),owner);
});

test('independent highlighters may register same language id without leaking state',()=>{
  const a=createRegexLanguage({id:'wave2143-shared',tokens:[{kind:'a',pattern:/a/}]});
  const b=createRegexLanguage({id:'wave2143-shared',tokens:[{kind:'b',pattern:/b/}]});
  const first=new SyntaxHighlighter({languages:[a]});
  const second=new SyntaxHighlighter({languages:[b]});
  assert.deepEqual(first.tokenize('ab',a.id),[{kind:'a',value:'a'},{kind:'plain',value:'b'}]);
  assert.deepEqual(second.tokenize('ab',b.id),[{kind:'plain',value:'a'},{kind:'b',value:'b'}]);
  assert.equal(first.language(a.id),a);
  assert.equal(second.language(b.id),b);
});
