import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter,htmlRenderer} from '../src/core.js';

test('unknown renderer is refused before arbitrary lexer invocation',()=>{
  let invoked=0;
  const language=Object.freeze({
    kind:'language',id:'wave2143-source',
    tokenize(value){invoked++;return Object.freeze([Object.freeze({kind:'word',value})]);}
  });
  const engine=new SyntaxHighlighter({languages:[language]});
  const hostileOptions=Object.freeze({renderer:'missing',classPrefix:'x" onclick="alert(1)'});
  assert.throws(()=>engine.highlight('<&"',language.id,hostileOptions),/unknown renderer/);
  assert.equal(invoked,0,'source lexer must not execute for an unknown renderer');
  assert.equal(engine.highlight('<&"',language.id,Object.freeze({classPrefix:'x" onclick="alert(1)'})),
    '<span class="x&quot; onclick=&quot;alert(1)word">&lt;&amp;&quot;</span>');
  assert.equal(invoked,1);
});

test('renderer registration retains owner, denies collisions without changing output',()=>{
  const engine=new SyntaxHighlighter();
  const first=Object.freeze({kind:'renderer',id:'wave2143-renderer',render:()=>'<safe>'});
  const impostor=Object.freeze({kind:'renderer',id:'wave2143-renderer',render:()=>'<evil>'});
  const language=Object.freeze({kind:'language',id:'wave2143-plain',tokenize:()=>[{kind:'plain',value:'<&'}]});
  engine.use(first);
  engine.use(first);
  engine.use(language);
  assert.throws(()=>engine.use(impostor),/registration conflict/);
  assert.equal(engine.highlight('ignored',language.id,{renderer:first.id}),'<safe>');
  assert.equal(htmlRenderer.render(Object.freeze([Object.freeze({kind:'plain',value:'<&'})])),'&lt;&amp;');
});
