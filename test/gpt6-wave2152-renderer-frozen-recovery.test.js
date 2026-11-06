import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, SyntaxHighlighter} from '../src/core.js';

test('frozen hostile token and class metadata are escaped without mutation',()=>{
  const tokens=Object.freeze([
    Object.freeze({kind:'danger',value:'<&"\'🙂\r\n'}),
    Object.freeze({kind:'plain',value:'<end>&'}),
  ]);
  const options=Object.freeze({classPrefix:'bad" onfocus="X&'});
  const expected='<span class="bad&quot; onfocus=&quot;X&amp;danger">&lt;&amp;&quot;&#039;🙂\r\n</span>&lt;end&gt;&amp;';
  const saved=JSON.stringify(tokens);
  for(let i=0;i<8;i++){
    assert.equal(htmlRenderer.render(tokens,options),expected);
    assert.equal(JSON.stringify(tokens),saved);
    assert.equal(options.classPrefix,'bad" onfocus="X&');
  }
});

test('failed renderer registration preserves original safe renderer and blocks tokenizer call',()=>{
  let invoked=0;
  const plugin={kind:'language',id:'wave2152-render',aliases:['w2152'],
    tokenize(input){invoked++; return [{kind:'plain',value:input}];}};
  const highlighter=new SyntaxHighlighter({languages:[plugin]});
  assert.throws(()=>highlighter.use({kind:'renderer',id:'html',render:()=>'<svg onload=alert(1)>'}),/renderer registration conflict/);
  assert.throws(()=>highlighter.highlight('<script>', 'w2152',{renderer:'missing'}),/unknown renderer/);
  assert.equal(invoked,0);
  assert.equal(highlighter.highlight('<script>', 'w2152'),'&lt;script&gt;');
  assert.equal(invoked,1);
  assert.equal(highlighter.language('w2152'),plugin);
});
