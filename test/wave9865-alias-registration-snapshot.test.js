import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage,SyntaxHighlighter} from '../src/core.js';

test('registry preserves original aliases even after both owner arrays are edited', () => {
  const supplied=['wave9865-short','wave9865-tiny'];
  const language=createRegexLanguage({
    id:'wave9865-language',aliases:supplied,
    tokens:[{kind:'atom',pattern:/ab/}],
  });
  supplied[0]='host-injected';
  supplied.push('host-extra');
  assert.deepEqual(language.aliases,['wave9865-short','wave9865-tiny']);

  const registry=new SyntaxHighlighter({languages:[language]});
  language.aliases[0]='renamed-after-register';
  language.aliases.push('new-after-register');
  assert.strictEqual(registry.language('wave9865-short'),language);
  assert.strictEqual(registry.language('wave9865-tiny'),language);
  assert.strictEqual(registry.language('host-injected'),undefined);
  assert.strictEqual(registry.language('new-after-register'),undefined);
  assert.strictEqual(registry.language('renamed-after-register'),undefined);
  for(const name of ['wave9865-language','wave9865-short','wave9865-tiny']){
    for(let i=0;i<15;i++){
      assert.deepEqual(registry.tokenize('zab',name),[
        {kind:'plain',value:'z'}, {kind:'atom',value:'ab'},
      ]);
    }
  }
  const conflict=createRegexLanguage({
    id:'wave9865-short',tokens:[{kind:'alien',pattern:/z/}],
  });
  assert.throws(()=>registry.use(conflict),/language registration conflict/);
  assert.strictEqual(registry.language('wave9865-short'),language);
  assert.strictEqual(registry.language('wave9865-tiny'),language);
});
