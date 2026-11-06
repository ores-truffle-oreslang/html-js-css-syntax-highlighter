import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, escapeHtml } from '../src/core.js';

// Verify hostile data is escaped in both HTML text and attributes.
test('immutable token metadata and class options cannot become HTML attributes', () => {
  const nul = String.fromCharCode(0);
  const input = Object.freeze([
    Object.freeze({ kind: 'tag" onclick="run()', value: '<img src=x onerror="run()">&' }),
    Object.freeze({ kind: 'plain', value: "😀&'<>"+nul }),
  ]);
  const options = Object.freeze({ classPrefix: 'x" onmouseover="hijack() ' });
  const language = Object.freeze({
    kind: 'language', id: 'wave2031-adversarial',
    tokenize() { return input; },
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const expected = '<span class="' +
    escapeHtml(options.classPrefix + input[0].kind) + '">' +
    escapeHtml(input[0].value) + '</span>' + escapeHtml(input[1].value);
  const original = input.map(token => ({ ...token }));
  for (let i = 0; i < 20; i++) {
    const actual = highlighter.highlight('ignored', language.id, options);
    assert.equal(actual, expected);
    assert.ok(!actual.includes('<img'));
    assert.ok(!actual.includes('onclick="'));
    assert.ok(!actual.includes('onmouseover="'));
    assert.ok(actual.includes('&lt;img'));
    assert.deepEqual(input, original);
  }
});
