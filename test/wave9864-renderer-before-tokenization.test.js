import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, htmlRenderer} from '../src/core.js';

test('unknown renderer is rejected before any caller-owned tokenization side effect', () => {
  let scans=0, renders=0;
  const language=Object.freeze({
    kind:'language', id:'wave9864-code', aliases:Object.freeze(['wave9864-alias']),
    tokenize(source) {
      scans++;
      return Object.freeze([Object.freeze({kind:'plain',value:source})]);
    },
  });
  const options=Object.freeze({renderer:'wave9864-audit',marker:'caller-owned'});
  const auditRenderer=Object.freeze({
    kind:'renderer',id:'wave9864-audit',
    render(tokens, suppliedOptions) {
      renders++;
      assert.strictEqual(suppliedOptions,options);
      assert.equal(tokens.length,1);
      assert.equal(tokens[0].value,'<&🥑');
      return JSON.stringify({tokens,marker:suppliedOptions.marker});
    },
  });
  const highlighter=new SyntaxHighlighter({
    languages:[language],renderers:[htmlRenderer,auditRenderer],
  });
  for(let i=0;i<25;i++) {
    assert.throws(()=>highlighter.highlight('<&🥑','wave9864-alias',
      {renderer:'not-registered'}),/unknown renderer/);
  }
  assert.equal(scans,0);
  assert.equal(renders,0);

  const expected=JSON.stringify({
    tokens:[{kind:'plain',value:'<&🥑'}],marker:'caller-owned',
  });
  assert.equal(highlighter.highlight('<&🥑','wave9864-alias',options),expected);
  assert.equal(scans,1);
  assert.equal(renders,1);
  assert.equal(highlighter.highlight('<&🥑','wave9864-code'),'&lt;&amp;🥑');
  assert.equal(scans,2);
  assert.equal(renders,1);
  assert.strictEqual(highlighter.language('wave9864-alias'),language);
  assert.strictEqual(highlighter.language('wave9864-code'),language);
});
