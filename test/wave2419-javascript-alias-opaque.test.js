// Built-in JS/TS host lexer alias equivalence, literal opacity and HTML safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';
import { javascript } from '../src/plugins/javascript.js';

const aliases = ['javascript', 'js', 'mjs', 'cjs', 'typescript', 'ts'];
const tick = String.fromCharCode(96);

test('all JS/TS aliases preserve comment/string/template opacity and source order', () => {
  const source = [
    '/* return true class and <script> */',
    'const str = "return true /* not a comment */";',
    'const template = ' + tick + 'if false // also not a comment' + tick + ';',
    'const fn = (n) => n + 0xffn;',
    'return true; // false return',
  ].join('\r\n');
  const h = new SyntaxHighlighter({languages: [javascript]});
  const reference = h.tokenize(source, 'javascript');
  assert.equal(reference.map(item => item.value).join(''), source);
  assert.deepEqual(reference.filter(item => item.kind === 'comment').map(item => item.value),
    ['/* return true class and <script> */', '// false return']);
  assert.deepEqual(reference.filter(item => item.kind === 'string').map(item => item.value),
    ['"return true /* not a comment */"', tick + 'if false // also not a comment' + tick]);
  assert.equal(reference.filter(item => item.kind === 'keyword' && item.value === 'return').length, 1);
  assert.deepEqual(reference.filter(item => item.kind === 'boolean').map(item => item.value), ['true']);

  for (const alias of aliases) {
    for (let repeat = 0; repeat < 12; repeat++) {
      assert.deepEqual(h.tokenize(source, alias), reference);
      const output = h.highlight(source, alias, {classPrefix:'evil" data-x="<'});
      assert.ok(output.includes('&lt;script&gt;'));
      assert.ok(!output.includes('<script>'));
      assert.ok(!output.includes('data-x="<'));
      assert.equal(output, h.highlight(source, 'javascript', {classPrefix:'evil" data-x="<' }));
    }
  }
});

test('same highlighter alternates disjoint JS sources without stale regex cursor', () => {
  const h = new SyntaxHighlighter({languages: [javascript]});
  const corpus = ['const a = 1;', 'return true;', '/* false */\r\nconst b = 2;',
    '"async return" && false', '💠const x = "🧪";'];
  for (let n = 0; n < 45; n++) {
    const source = corpus[n % corpus.length];
    const actual = h.tokenize(source, aliases[n % aliases.length]);
    assert.equal(actual.map(t => t.value).join(''), source);
    assert.ok(actual.every(t => t.value.length));
    assert.deepEqual(actual, javascript.tokenize(source));
  }
});
