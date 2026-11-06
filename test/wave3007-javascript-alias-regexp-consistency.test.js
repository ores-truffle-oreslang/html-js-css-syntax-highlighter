import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';
import { javascript } from '../src/plugins/javascript.js';

test('JS/TS aliases conserve mixed operator source and repeated regex cursor state', () => {
  const source = 'const v = obj?.fn(0xAFn ?? 12.5); // 💡\r\nreturn v!==null && v**2';
  const highlighter = new SyntaxHighlighter({languages: [javascript]});
  const original = highlighter.tokenize(source, 'javascript');
  assert.equal(original.map(t => t.value).join(''), source);
  assert.ok(original.some(t => t.kind === 'operator' && t.value === '?.'));
  assert.ok(original.some(t => t.kind === 'operator' && t.value === '??'));
  assert.ok(original.some(t => t.kind === 'operator' && t.value === '!=='));
  assert.ok(original.some(t => t.kind === 'operator' && t.value === '**'));
  for (const alias of ['javascript', 'js', 'mjs', 'cjs', 'typescript', 'ts']) {
    for (let round = 0; round < 3; round++) {
      assert.deepEqual(highlighter.tokenize(source, alias), original, alias);
    }
  }
});
