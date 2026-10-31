import test from 'node:test';
import assert from 'node:assert/strict';
import {oreslangPreview} from '../src/plugins/oreslang-target-preview.js';

test('preview quoted Symbols fail closed at newline without losing later keywords', () => {
  for (const source of ['#"unterminated return', "#'unfinished raise"]) {
    const toks=oreslangPreview.tokenize(source);
    assert.equal(toks.map(t=>t.value).join(''),source);
    assert.ok(toks.every(t=>t.kind!=='symbol'),source);
    assert.ok(toks.every(t=>t.kind!=='keyword'&&t.kind!=='runtimeGlobal'),source);
  }
  for (const source of ['#"unfinished\\nreturn', "#'unfinished\\r\\nraise"]) {
    const toks=oreslangPreview.tokenize(source);
    assert.equal(toks.map(t=>t.value).join(''),source);
    assert.ok(toks.every(t=>t.kind!=='symbol'),source);
    assert.ok(toks.some(t=>t.kind==='keyword'&&t.value==='return'
      ||t.kind==='runtimeGlobal'&&t.value==='raise'),source);
  }
});
test('preview and installed tokenizers are separate plugins', () => {
  assert.equal(oreslangPreview.id,'oreslang-target-preview');
  assert.deepEqual(oreslangPreview.aliases,[]);
});
