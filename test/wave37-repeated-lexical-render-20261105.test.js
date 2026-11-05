// Host renderer escaping and repeatability; no guest lexical parity claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage,SyntaxHighlighter,escapeHtml} from '../src/core.js';

test('escaping keeps plain HTML and a hostile class prefix inert',()=>{
  const language=createRegexLanguage({id:'wave37-render',tokens:[
    {kind:'label',pattern:/A/},
  ]});
  const highlighter=new SyntaxHighlighter({languages:[language]});
  const source='A<&"\'';
  const options={classPrefix:'x&"'};
  const expected='<span class="x&amp;&quot;label">A</span>&lt;&amp;&quot;&#039;';
  assert.equal(highlighter.highlight(source,language.id,options),expected);
  assert.equal(highlighter.highlight(source,language.id,options),expected);
  assert.equal(escapeHtml('<&"\''),'&lt;&amp;&quot;&#039;');
});

test('rendering repeated inputs never leaks a previous regex cursor',()=>{
  const language=createRegexLanguage({id:'wave37-cursor',tokens:[
    {kind:'letter',pattern:/A/g},
  ]});
  const highlighter=new SyntaxHighlighter({languages:[language]});
  for(const input of ['A','XA','A','AA']){
    const first=highlighter.highlight(input,language.id);
    assert.equal(highlighter.highlight(input,language.id),first);
    assert.equal(language.tokenize(input).map(token=>token.value).join(''),input);
  }
});
