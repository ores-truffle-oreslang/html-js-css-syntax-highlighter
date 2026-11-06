// Real built-in HTML grammar and renderer, not a compiler guest assertion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';
import { html } from '../src/plugins/html.js';

test('HTML plugin partitions and escapes comments, attributes, and named entities', () => {
  const highlighter = new SyntaxHighlighter({ languages: [html] });
  const source = '<!DOCTYPE html>\n<!-- <fake> & -->\n<section title="a&b">🍃&amp; &bad;</section>';
  const tokens = highlighter.tokenize(source, 'html');
  assert.equal(tokens.map(token => token.value).join(''), source);
  assert.ok(tokens.some(token => token.kind === 'doctype'));
  assert.ok(tokens.some(token => token.kind === 'comment' && token.value === '<!-- <fake> & -->'));
  assert.ok(tokens.some(token => token.kind === 'string' && token.value === '"a&b"'));
  assert.ok(tokens.some(token => token.kind === 'entity' && token.value === '&amp;'));
  assert.ok(tokens.some(token => token.kind === 'entity' && token.value === '&bad;'));
  const rendered = highlighter.highlight(source, 'html');
  assert.equal(highlighter.highlight(source, 'htm'), rendered);
  assert.ok(rendered.includes('&lt;section'));
  assert.ok(rendered.includes('&amp;amp;'));
  assert.ok(rendered.includes('&amp;bad;'));
  assert.ok(!rendered.includes('<section') && !rendered.includes('<!-- <fake>'));
  assert.deepEqual(highlighter.tokenize(source, 'html'), tokens);
});
