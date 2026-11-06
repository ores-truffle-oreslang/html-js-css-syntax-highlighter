// Built-in CSS lexer public-path tests; host-only, not AttoLang guest parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { css } from '../src/plugins/css.js';
import { SyntaxHighlighter } from '../src/core.js';

const source = [
  '@media screen and (min-width: 42rem) {',
  '  .card #root { --brand: #abc; color: #ff00aa;',
  '    animation-duration: 150ms; content: "<img x=\\"y\\"> /*not comment*/";',
  '    /* #hidden { color: #000; width: 3px; } */',
  '  }',
  '}',
].join('\r\n');

test('CSS at-rule, selector, custom property, color and duration boundaries conserve source', () => {
  const highlighter = new SyntaxHighlighter({ languages: [css] });
  for (let attempt = 0; attempt < 24; attempt++) {
    const tokens = highlighter.tokenize(source, css.id);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
    assert.deepEqual(tokens.filter(token => token.kind === 'atrule').map(token => token.value),
      ['@media']);
    assert.deepEqual(tokens.filter(token => token.kind === 'selector').map(token => token.value),
      ['.card', '#root']);
    assert.deepEqual(tokens.filter(token => token.kind === 'hex').map(token => token.value),
      ['#abc', '#ff00aa']);
    assert.deepEqual(tokens.filter(token => token.kind === 'property').map(token => token.value),
      ['min-width', '--brand', 'color', 'animation-duration', 'content']);
    assert.deepEqual(tokens.filter(token => token.kind === 'number').map(token => token.value),
      ['42rem', '150ms']);
    assert.deepEqual(tokens.filter(token => token.kind === 'comment').map(token => token.value),
      ['/* #hidden { color: #000; width: 3px; } */']);
    assert.deepEqual(tokens.filter(token => token.kind === 'string').map(token => token.value),
      ['"<img x=\\"y\\"> /*not comment*/"']);
  }
});

test('CSS comments and strings remain opaque across hostile nested-looking syntax', () => {
  const input = '/* @import #abc .fake { width: 7px; } */\r\n' +
    'a { content: "</style><script>/* decoy */"; color: #abc; }';
  const tokens = css.tokenize(input);
  assert.equal(tokens.map(token => token.value).join(''), input);
  assert.equal(tokens.filter(token => token.kind === 'comment').length, 1);
  assert.deepEqual(tokens.filter(token => token.kind === 'hex').map(token => token.value),
    ['#abc']);
  assert.deepEqual(tokens.filter(token => token.kind === 'property').map(token => token.value),
    ['content', 'color']);
  assert.deepEqual(tokens.filter(token => token.kind === 'string').map(token => token.value),
    ['"</style><script>/* decoy */"']);

  const html = new SyntaxHighlighter({ languages: [css] }).highlight(input, css.id);
  assert.ok(html.includes('&lt;/style&gt;&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});
