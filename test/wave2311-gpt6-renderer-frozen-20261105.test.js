import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

// Source-owned host checks only; not an AttoLang guest/backend certification.
test('HTML rendering escapes text and attribute contexts without changing frozen inputs', () => {
  const tokens=Object.freeze([
    Object.freeze({kind:'plain',value:'💠&<>\r\n'}),
    Object.freeze({kind:'keyword',value:'<tag>&"\''}),
    Object.freeze({kind:'plain',value:'\0©'}),
  ]);
  const options=Object.freeze({classPrefix:'att" onclick="bad&<'});
  const expected='💠&amp;&lt;&gt;\r\n'
    + '<span class="att&quot; onclick=&quot;bad&amp;&lt;keyword">&lt;tag&gt;&amp;&quot;&#039;</span>'
    + '\0©';
  for(let round=0;round<8;round++) {
    assert.equal(htmlRenderer.render(tokens,options),expected);
  }
  assert.deepEqual(tokens.map(token=>token.value),['💠&<>\r\n','<tag>&"\'','\0©']);
  assert.equal(options.classPrefix,'att" onclick="bad&<');
});

test('unknown renderer fails before any untrusted language tokenizer can run', () => {
  let calls=0;
  const language=createRegexLanguage({id:'wave2311-known',tokens:[{kind:'text',pattern:/x/}]});
  const checked={...language, tokenize(source){calls++;return language.tokenize(source);}};
  const highlighter=new SyntaxHighlighter({languages:[checked]});
  assert.throws(()=>highlighter.highlight('x','wave2311-known',{renderer:'not-registered'}),/unknown renderer/);
  assert.equal(calls,0);
  assert.equal(highlighter.highlight('x','wave2311-known'),'<span class="tok-text">x</span>');
  assert.equal(calls,1);
});
