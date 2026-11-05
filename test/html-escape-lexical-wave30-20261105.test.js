import test from 'node:test';
import assert from 'node:assert/strict';
import { highlight, defaultHighlighter } from '../src/index.js';

test('hostile HTML in a string is escaped, never activated as an element', () => {
  const source = 'const String payload = "<svg/onload=alert(1)>";';
  const html = highlight(source, 'oreslang');
  assert.ok(!html.includes('<svg'), html);
  assert.ok(html.includes('&lt;svg'), html);
  assert.ok(!html.includes('<script'), html);
});

test('lexer preserves source bytes across HTML-sensitive operator boundaries', () => {
  const source = 'return a < b and c > d; // <iframe src=x>';
  const tokens = defaultHighlighter.tokenize(source, 'oreslang');
  assert.equal(tokens.map(t => t.value).join(''), source);
  const html = highlight(source, 'oreslang');
  assert.ok(!html.includes('<iframe'), html);
  assert.ok(html.includes('&lt;iframe'), html);
});

test('file-extension alias does not change sanitized rendered output', () => {
  const source = 'return "<img src=x onerror=alert(1)>";';
  assert.equal(highlight(source, 'ores'), highlight(source, 'oreslang'));
});
