import test from 'node:test';
import assert from 'node:assert/strict';
import { css } from '../src/plugins/css.js';
import { SyntaxHighlighter } from '../src/core.js';

// CSS presentation contracts only; no compiler-backed guest proof.
test('CSS comment and quoted colors stay opaque across at-rules and selectors', () => {
  const source = '/* @media color: #fff */\r\n@media screen {\n.root { color: #abc; --accent: "#def"; }\n#panel { width: 1.5rem; }\n}';
  const expected = new Map([
    ['/* @media color: #fff */', 'comment'],
    ['@media', 'atrule'],
    ['.root', 'selector'],
    ['color', 'property'],
    ['#abc', 'hex'],
    ['--accent', 'property'],
    ['"#def"', 'string'],
    ['#panel', 'selector'],
    ['width', 'property'],
    ['1.5rem', 'number'],
  ]);
  const original = new TextEncoder().encode(source);
  const highlighter = new SyntaxHighlighter({languages:[css]});
  for (let i=0;i<8;i++) {
    const tokens = css.tokenize(source);
    assert.deepEqual(new TextEncoder().encode(tokens.map(t=>t.value).join('')),original);
    for (const [value,kind] of expected) {
      assert.ok(tokens.some(t=>t.kind===kind && t.value===value), 'missing ' + kind + ' ' + value);
    }
    assert.equal(tokens.some(t=>t.kind==='hex' && t.value==='#def'),false);
    assert.ok(highlighter.highlight('color: #abc','css').includes('<span class="tok-hex">#abc</span>'));
    assert.deepEqual(css.tokenize('/*#fff*/').map(t=>[t.kind,t.value]),[['comment','/*#fff*/']]);
  }
});

test('CSS scanner does not retain state across unrelated Unicode input', () => {
  const source = '.a { color: #aabbcc; }';
  const before = css.tokenize(source);
  css.tokenize('💠\r\n@supports (display:grid) { --a: "x"; }');
  assert.deepEqual(css.tokenize(source),before);
});
