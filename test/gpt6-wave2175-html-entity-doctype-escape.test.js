import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHighlighter} from '../src/index.js';

const expectedEscaped=s=>Array.from(s).map(ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
})[ch]??ch).join('');

test('built-in HTML and htm aliases preserve doctype, entities and hostile markup',()=>{
  const source='<!DoCtYpE html><b data-q="<&🙂">Text &amp; &#42; &#x1F642; &copy; <!-- <svg onload="x"> --></b>\r\n';
  const tokens=defaultHighlighter.tokenize(source,'html');
  assert.equal(tokens.map(x=>x.value).join(''),source);
  assert.equal(tokens[0].kind,'doctype');
  for(const entity of ['&amp;','&#42;','&#x1F642;','&copy;']){
    assert.ok(tokens.some(t=>t.kind==='entity'&&t.value===entity),entity+' must be an entity');
  }
  assert.ok(tokens.some(t=>t.kind==='comment'&&t.value.includes('<svg onload=')));
  assert.deepEqual(defaultHighlighter.tokenize(source,'htm'),tokens);
  const rendered=defaultHighlighter.highlight(source,'htm');
  const text=rendered.replace(/<span class="[^"]*">|<\/span>/g,'');
  assert.equal(text,expectedEscaped(source));
  assert.ok(!rendered.includes('<svg onload='));
  assert.ok(!rendered.includes('<!DoCtYpE'));
  assert.ok(!rendered.includes('<b data-q='));
});

test('hostile class prefix metadata stays escaped and does not contaminate subsequent renders',()=>{
  const source='<div title="x & y">🙂&copy;</div>';
  const options=Object.freeze({classPrefix:'x" onmouseover="bad&'});
  const first=defaultHighlighter.highlight(source,'html',options);
  assert.ok(first.includes('x&quot; onmouseover=&quot;bad&amp;'));
  assert.ok(!first.includes(' onmouseover="bad&'));
  const restored=defaultHighlighter.highlight(source,'html');
  assert.ok(restored.includes('class="tok-tag"'));
  assert.ok(!restored.includes('onmouseover'));
  assert.equal(first.replace(/<span class="[^"]*">|<\/span>/g,''),expectedEscaped(source));
});
