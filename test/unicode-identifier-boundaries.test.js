import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter } from '../src/index.js';

const tokenize = source => defaultHighlighter.tokenize(source, 'oreslang');
const identifiers = [
  'éreturn', 'returné', '中eq', 'eq中',
  'πpanic', 'panicπ', 'αgpu', 'gpuα',
  'éreturn_suffix', 'return_中'
];

test('Java BMP Unicode identifiers are never partially colored as reserved words', () => {
  for (const source of identifiers) {
    const tokens = tokenize(source);
    assert.equal(tokens.map(t => t.value).join(''), source, source);
    assert.ok(!tokens.some(t=>['keyword','runtimeGlobal','operator'].includes(t.kind)), source);
  }
});

test('following separated ASCII keyword is still highlighted after Unicode identifier', () => {
  for (const source of identifiers) {
    const text = source + ' return';
    const tokens = tokenize(text);
    assert.equal(tokens.map(t=>t.value).join(''), text);
    assert.deepEqual(tokens.filter(t=>t.kind==='keyword').map(t=>t.value), ['return'], source);
  }
});
