import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHighlighter,highlight,oreslang} from '../src/index.js';

test('AttoLang public aliases preserve the original Oreslang grammar and precedence',()=>{
  const names=['oreslang','ores','ores-lang','atto','attolang','atto-lang'];
  const source='fnc greet() { return #hello; }';
  const baseline=defaultHighlighter.tokenize(source,'oreslang');
  assert.equal(baseline.map(x=>x.value).join(''),source);
  assert.ok(baseline.some(x=>x.kind==='keyword'&&x.value==='fnc'));
  assert.ok(baseline.some(x=>x.kind==='keyword'&&x.value==='return'));
  assert.ok(baseline.some(x=>x.kind==='symbol'&&x.value==='#hello'));
  for(const name of names){
    assert.equal(defaultHighlighter.language(name),oreslang);
    assert.deepEqual(defaultHighlighter.tokenize(source,name),baseline);
    assert.equal(highlight(source,name),highlight(source,'oreslang'));
  }
});

test('new AttoLang selectors retain escaped output for untrusted source text',()=>{
  const source='fnc x() { return "<script>&"; }';
  const rendered=highlight(source,'atto');
  assert.equal(rendered,highlight(source,'attolang'));
  assert.ok(rendered.includes('&lt;script&gt;&amp;'));
  assert.ok(!rendered.includes('<script>'));
});
