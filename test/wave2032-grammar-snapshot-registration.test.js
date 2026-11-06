import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter,createRegexLanguage} from '../src/core.js';

test('registered compiled grammar snapshots caller-owned pattern, category and aliases', () => {
  const aliases=['wave2032-short'];
  const pattern=/alpha/gi;
  const rules=[
    {kind:'word',pattern},
    {kind:'multiline',pattern:/x.y/s}
  ];
  const grammar=createRegexLanguage({id:'wave2032-long',aliases,tokens:rules});
  const highlighter=new SyntaxHighlighter({languages:[grammar]});
  aliases.push('unreviewed-alias');
  rules[0].kind='malicious';
  rules[0].pattern=/different/;
  pattern.lastIndex=500;
  assert.equal(highlighter.language('wave2032-short'),grammar);
  assert.equal(highlighter.language('unreviewed-alias'),undefined);
  const source='ALPHA x\ny';
  const expected=[
    {kind:'word',value:'ALPHA'},
    {kind:'plain',value:' '},
    {kind:'multiline',value:'x\ny'}
  ];
  for (let i=0;i<3;i++) {
    assert.deepEqual(highlighter.tokenize(source,'wave2032-short'),expected);
    assert.equal(highlighter.tokenize(source,'wave2032-short').map(t=>t.value).join(''),source);
  }
  assert.equal(pattern.lastIndex,500,'caller-owned RegExp cursor must not be mutated');
  assert.equal(highlighter.use(grammar),highlighter);
});
