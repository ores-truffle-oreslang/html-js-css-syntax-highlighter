import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, css, escapeHtml } from '../src/index.js';

test('built-in CSS scanner separates opaque source from live rules and conserves source', () => {
  const source = '/* @media #fff color: */\r\n@media screen { .tile { --accent: #aBcD; content: "return #fff"; width: 12px; } }';
  const tokens = defaultHighlighter.tokenize(source, 'css');
  const values = kind => tokens.filter(t => t.kind === kind).map(t => t.value);
  assert.deepEqual(values('comment'), ['/* @media #fff color: */']);
  assert.deepEqual(values('atrule'), ['@media']);
  assert.deepEqual(values('selector'), ['.tile']);
  assert.deepEqual(values('hex'), ['#aBcD']);
  assert.deepEqual(values('property'), ['--accent', 'content', 'width']);
  assert.deepEqual(values('string'), ['"return #fff"']);
  assert.deepEqual(values('number'), ['12px']);
  assert.equal(tokens.map(t => t.value).join(''), source);
  assert.equal(defaultHighlighter.language('css'), css);
  const rendered = defaultHighlighter.highlight(source, 'css');
  assert.equal(rendered.replace(/<\/?span(?:\s+[^>]*)?>/g, ''), escapeHtml(source));
  assert.deepEqual(defaultHighlighter.tokenize(source, 'css'), tokens);
  assert.equal(rendered.includes('<style'), false);
});

test('CSS strings and comments never promote embedded fake properties or colors', () => {
  const source = '/* --admin: #abc */ .tile { content: "#bad --token: 10px"; }';
  const tokens = css.tokenize(source);
  assert.deepEqual(tokens.filter(t => t.kind === 'property').map(t => t.value), ['content']);
  assert.deepEqual(tokens.filter(t => t.kind === 'hex').map(t => t.value), []);
  assert.equal(tokens.map(t => t.value).join(''), source);
});
