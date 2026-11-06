import test from 'node:test';
import assert from 'node:assert/strict';
import {oreslang,highlight} from '../src/index.js';

// Host lexer and HTML rendering evidence; neither test compiles a guest program.
test('source partitions remain stable across nested comments and quoted Symbol bodies',()=>{
  const source='fnc main() {\r\n/* outer /* return fnc */ await */\r\nreturn #"rt borrow";\r\n}';
  const first=oreslang.tokenize(source);
  assert.deepEqual(oreslang.tokenize(source),first);
  assert.equal(first.map(x=>x.value).join(''),source);
  const comments=first.filter(x=>x.kind==='comment');
  assert.equal(comments.length,1);
  assert.ok(comments[0].value.includes('/* return fnc */'));
  assert.equal(first.filter(x=>x.kind==='keyword'&&x.value==='return').length,1);
  assert.ok(first.some(x=>x.kind==='symbol'&&x.value==='#"rt borrow"'));
});

test('invalid UTF-16 or NUL is fail-closed even beside apparently valid AttoLang code',()=>{
  for(const bad of ['fnc x() {}\u0000return','fnc x(){\uD800 return}','fnc x(){\uDC00 return}']){
    assert.deepEqual(oreslang.tokenize(bad),[{kind:'plain',value:bad}]);
    const rendered=highlight(bad,'oreslang');
    assert.ok(!rendered.includes('<span '),'no keywords may be colored from invalid source');
    assert.equal(rendered.includes('&lt;'),bad.includes('<'));
  }
});
