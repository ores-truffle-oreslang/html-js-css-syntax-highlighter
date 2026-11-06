import test from 'node:test';
import assert from 'node:assert/strict';
import { css } from '../src/plugins/css.js';

test('comments and strings own their inner color-looking bytes, real CSS stays typed', () => {
  const source = '😀/* @media #fff 99px */ .a{content:"#f0f";color:#abc;width:12px;}';
  let baseline;
  for (let n = 0; n < 32; n++) {
    const tokens = css.tokenize(source);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.deepEqual(tokens.filter(token => token.kind === 'comment').map(t => t.value),
      ['/* @media #fff 99px */']);
    assert.deepEqual(tokens.filter(token => token.kind === 'string').map(t => t.value),
      ['"#f0f"']);
    assert.deepEqual(tokens.filter(token => token.kind === 'hex').map(t => t.value),
      ['#abc']);
    assert.deepEqual(tokens.filter(token => token.kind === 'number').map(t => t.value),
      ['12px']);
    assert.ok(tokens.some(t => t.kind === 'selector' && t.value === '.a'));
    assert.ok(tokens.some(t => t.kind === 'property' && t.value === 'color'));
    if (baseline) assert.deepEqual(tokens, baseline);
    baseline = tokens;
    // Interleave another token stream: cached grammar state must not leak.
    assert.equal(css.tokenize('@media screen{.x{color:#a1b2c3}}')
      .map(token => token.value).join(''), '@media screen{.x{color:#a1b2c3}}');
  }
});

test('CRLF, quoted HTML-like content, and unquoted hex remain distinct', () => {
  const source = '\r\n@media screen{.a{content:"<& #bad";color:#c0ffee;width:0.5rem}}\r\n';
  const tokens = css.tokenize(source);
  assert.equal(tokens.map(t => t.value).join(''), source);
  assert.deepEqual(tokens.filter(t => t.kind === 'atrule').map(t => t.value), ['@media']);
  assert.deepEqual(tokens.filter(t => t.kind === 'string').map(t => t.value), ['"<& #bad"']);
  assert.deepEqual(tokens.filter(t => t.kind === 'hex').map(t => t.value), ['#c0ffee']);
  assert.deepEqual(tokens.filter(t => t.kind === 'number').map(t => t.value), ['0.5rem']);
});
