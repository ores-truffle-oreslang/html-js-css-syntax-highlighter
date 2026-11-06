import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, javascript, escapeHtml } from '../src/index.js';

test('JavaScript built-in aliases share the same grammar and preserve opaque lexemes', () => {
  const source = '// return async false\r\nconst rendered = "<script>return</script>"; /* await */ function hello() { return `throw`; }';
  const canonical = javascript.tokenize(source);
  assert.deepEqual(canonical.filter(t => t.kind === 'comment').map(t => t.value),
    ['// return async false', '/* await */']);
  assert.deepEqual(canonical.filter(t => t.kind === 'string').map(t => t.value),
    ['"<script>return</script>"', '`throw`']);
  assert.deepEqual(canonical.filter(t => t.kind === 'keyword').map(t => t.value),
    ['const', 'function', 'return']);
  assert.deepEqual(canonical.filter(t => t.kind === 'function').map(t => t.value),
    ['hello']);
  assert.equal(canonical.map(t => t.value).join(''), source);
  for (const id of ['javascript', 'js', 'mjs', 'cjs', 'typescript', 'ts']) {
    assert.equal(defaultHighlighter.language(id), javascript);
    for (let repeat = 0; repeat < 3; repeat++) {
      assert.deepEqual(defaultHighlighter.tokenize(source, id), canonical, id);
      const html = defaultHighlighter.highlight(source, id);
      assert.equal(html.replace(/<\/?span(?:\s+[^>]*)?>/g, ''), escapeHtml(source), id);
      assert.equal(html.includes('<script>'), false);
    }
  }
});
