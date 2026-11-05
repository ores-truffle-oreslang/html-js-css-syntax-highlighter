// Host highlighter side-effect boundary, not native guest compiler proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter,escapeHtml,htmlRenderer} from '../src/core.js';

test('unknown renderer is rejected before third-party tokenizer can run',()=>{
  let tokenizations=0;
  let customRenders=0;
  const language={kind:'language',id:'wave2331-trust',aliases:[],
    tokenize(code){tokenizations++;return [{kind:'plain',value:code}];}};
  const customRenderer={kind:'renderer',id:'observed',
    render(tokens){customRenders++;return tokens.map(t=>t.value).join('');}};
  const highlighter=new SyntaxHighlighter({languages:[language],renderers:[htmlRenderer,customRenderer]});
  for(let i=0;i<4;i++){
    assert.throws(()=>highlighter.highlight('untrusted<&"',language.id,{renderer:'missing'}),
      /unknown renderer/);
  }
  assert.equal(tokenizations,0);
  assert.equal(customRenders,0);
  assert.equal(highlighter.highlight('ok',language.id,{renderer:'observed'}),'ok');
  assert.equal(customRenders,1);
  assert.equal(tokenizations,1);
  const payload='🦊<&"\'\r\n<script>';
  assert.equal(highlighter.highlight(payload,language.id,{renderer:'observed'}),payload);
  assert.equal(highlighter.highlight(payload,language.id,{renderer:'html'}),escapeHtml(payload));
  assert.equal(customRenders,2);
  assert.equal(tokenizations,3);
});

test('unknown language does not reach a registered custom renderer',()=>{
  let renders=0;
  const renderer={kind:'renderer',id:'checked',render(){renders++;return 'ok';}};
  const highlighter=new SyntaxHighlighter({renderers:[renderer]});
  assert.throws(()=>highlighter.highlight('x','missing',{renderer:'checked'}),/unknown language/);
  assert.equal(renders,0);
});
