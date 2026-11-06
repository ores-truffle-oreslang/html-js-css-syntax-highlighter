import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, htmlRenderer, createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Independent character-by-character oracle, rather than reusing production escapeHtml.
const referenceEscape = value => Array.from(String(value), char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
})[char] ?? char).join('');

test('frozen token values and hostile class metadata never obtain HTML authority',()=>{
  const values=[
    '💠<script data-x="1">&\u0000\r\n',
    "a' onclick='injected",
    '\uD800\uDC00\u2028\u2029<&"'
  ];
  const prefix='tok" onmouseover="alert(1)&<';
  const options=Object.freeze({classPrefix:prefix});
  for(const value of values){
    const tokens=Object.freeze([
      Object.freeze({kind:'plain',value}),
      Object.freeze({kind:'word" tabindex="1',value}),
      Object.freeze({kind:'plain',value})
    ]);
    const expected=referenceEscape(value)
      + '<span class="'+referenceEscape(prefix+'word" tabindex="1')+'">'
      + referenceEscape(value)+'</span>'+referenceEscape(value);
    for(let attempt=0;attempt<3;attempt++){
      assert.equal(htmlRenderer.render(tokens,options),expected);
      assert.equal(escapeHtml(value),referenceEscape(value));
      assert.equal(tokens[0].value,value,'caller-owned tokens unchanged');
    }
  }
});

test('real highlighter preserves escaped plain prefixes and registered lexer spans',()=>{
  const grammar=createRegexLanguage({id:'merge2033-render',tokens:[
    {kind:'keyword',pattern:/return/u}
  ]});
  const syntax=new SyntaxHighlighter({languages:[grammar]});
  const code='💠<&\r\nreturn\u0000"\'';
  assert.deepEqual(syntax.tokenize(code,grammar.id),[
    {kind:'plain',value:'💠<&\r\n'},
    {kind:'keyword',value:'return'},
    {kind:'plain',value:'\u0000"\''}
  ]);
  assert.equal(syntax.highlight(code,grammar.id),
    referenceEscape('💠<&\r\n')+'<span class="tok-keyword">return</span>'
    +referenceEscape('\u0000"\''));
});
