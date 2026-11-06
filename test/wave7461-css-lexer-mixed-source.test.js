import test from 'node:test';
import assert from 'node:assert/strict';
import {css} from '../src/plugins/css.js';
import {SyntaxHighlighter, htmlRenderer} from '../src/core.js';

// Integration against the public CSS lexer: opaque comments and strings must
// outrank their keyword-looking contents; tokens conserve exact UTF-16 input.
test('CSS comments, at-rules, properties, hex colors and strings retain priority across CRLF', () => {
  const source = [
    '/* @media .foo #fff --hidden: 8px; */',
    '@media screen {',
    '  --accent: #aBc;',
    '  color: "content <b>& #fff";',
    '  margin: 10px;',
    '}',
    '.foo { color: red; }'
  ].join('\r\n');
  const highlighter = new SyntaxHighlighter({languages: [css], renderers: [htmlRenderer]});
  let expected;
  for (let iteration = 0; iteration < 6; iteration++) {
    const tokens = highlighter.tokenize(source, 'css');
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.ok(tokens.every(t => t.value.length > 0));
    assert.deepEqual(tokens[0], {kind: 'comment', value: '/* @media .foo #fff --hidden: 8px; */'});
    const has = (kind, value) => tokens.some(t => t.kind === kind && t.value === value);
    assert.ok(has('atrule', '@media'));
    assert.ok(has('property', '--accent'));
    assert.ok(has('hex', '#aBc'));
    assert.ok(has('property', 'color'));
    assert.ok(has('string', '"content <b>& #fff"'));
    assert.ok(has('number', '10px'));
    assert.ok(has('selector', '.foo'));
    assert.ok(tokens.every(t => !t.value.includes('--hidden') || t.kind === 'comment'));
    if (expected) assert.deepEqual(tokens, expected);
    expected = tokens;
    const rendered = highlighter.highlight(source, 'css');
    assert.ok(rendered.includes('&lt;b&gt;&amp;'));
    assert.ok(!rendered.includes('<b>'));
  }
});
