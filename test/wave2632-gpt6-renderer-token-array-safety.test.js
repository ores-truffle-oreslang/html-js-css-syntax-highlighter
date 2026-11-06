// Host HTML renderer contract, not compiler-backed guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'})[c]);

test('immutable hostile token arrays and options remain unchanged across repeated HTML rendering', () => {
  const source = '🧪<svg onload="x">&\u0000\r\n';
  const tokens = Object.freeze([
    Object.freeze({kind: 'markup" onmouseover="x', value: '<svg onload="x">'}),
    Object.freeze({kind: 'plain', value: '🧪\u0000\r\n'}),
    Object.freeze({kind: 'punct', value: '&\'<>'}),
  ]);
  const options = Object.freeze({classPrefix: 'prefix" data-probe="bad&<'});
  let calls = 0;
  const language = {
    kind: 'language', id: 'wave2632-hostile', aliases: ['wave2632-alias'],
    tokenize(input) {
      assert.equal(input, source);
      calls++;
      return tokens;
    },
  };
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const expected = [
    '<span class="' + escape(options.classPrefix + tokens[0].kind) + '">' + escape(tokens[0].value) + '</span>',
    escape(tokens[1].value),
    '<span class="' + escape(options.classPrefix + tokens[2].kind) + '">' + escape(tokens[2].value) + '</span>',
  ].join('');
  const snapshot = JSON.stringify(tokens);
  for (let i = 0; i < 12; i++) {
    const id = i % 2 === 0 ? 'wave2632-hostile' : 'wave2632-alias';
    assert.equal(highlighter.highlight(source, id, options), expected);
    assert.equal(JSON.stringify(tokens), snapshot);
    assert.ok(!expected.includes('<svg'));
    assert.ok(!expected.includes(' onmouseover="'));
  }
  assert.equal(calls, 12);
});
