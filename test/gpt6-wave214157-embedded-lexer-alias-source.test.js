import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter} from '../src/core.js';
import {oreslang} from '../src/plugins/oreslang.js';

// Real public lexer, not compiler-generated guest execution.
test('nested comments and quoted Symbols are opaque through every language alias', () => {
  const source = '/* return /* throw */ await */\r\n#"ready" return';
  const host = new SyntaxHighlighter({languages:[oreslang]});
  const expected = oreslang.tokenize(source);
  assert.equal(expected.map(t=>t.value).join(''),source);
  assert.deepEqual(expected.filter(t=>t.kind==='comment').map(t=>t.value),[
    '/* return /* throw */ await */',
  ]);
  assert.deepEqual(expected.filter(t=>t.kind==='symbol').map(t=>t.value),['#"ready"']);
  assert.deepEqual(expected.filter(t=>t.kind==='keyword').map(t=>t.value),['return']);
  assert.equal(expected.some(t=>t.kind==='runtimeGlobal'),false);
  for(const alias of ['oreslang','ores','ores-lang']){
    for(let i=0;i<3;i++){
      assert.deepEqual(host.tokenize(source,alias),expected);
      assert.equal(host.highlight(source,alias),host.highlight(source,'oreslang'));
    }
  }
});
test('invalid quoted Symbol does not color embedded keywords, later source recovers',()=>{
  const source = "#'bad\\q throw'\r\nreturn";
  const tokens=oreslang.tokenize(source);
  assert.equal(tokens.map(t=>t.value).join(''),source);
  assert.equal(tokens.some(t=>t.kind==='runtimeGlobal'),false);
  assert.deepEqual(tokens.filter(t=>t.kind==='keyword').map(t=>t.value),['return']);
  assert.ok(tokens.some(t=>t.kind==='plain'&&t.value.includes('throw')));
});
