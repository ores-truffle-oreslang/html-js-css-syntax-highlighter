// Contract for real built-in HTML/htm plugin, not a hand-rolled test grammar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHighlighter, highlight } from '../src/index.js';

test('DOCTYPE, attributes, entity and opaque comments survive aliases without unsafe markup', () => {
  const source = '<!DOCTYPE html>\r\n<div data-v="<&>">🙂<!-- <script> -->&amp;</div>';
  const html = defaultHighlighter.tokenize(source, 'html');
  for (const alias of ['html', 'htm']) {
    const tokens = defaultHighlighter.tokenize(source, alias);
    assert.deepEqual(tokens, html);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
    for (const kind of ['doctype','tag','attribute','string','comment','entity']) {
      assert.ok(tokens.some(token => token.kind === kind), kind);
    }
    assert.equal(tokens.filter(token => token.kind === 'comment').length, 1);
    assert.ok(tokens.some(token => token.kind === 'comment' && token.value.includes('<script>')));
    const rendered = highlight(source, alias);
    assert.doesNotMatch(rendered, /<script>/i);
    assert.match(rendered, /&lt;script&gt;/);
    assert.match(rendered, /&lt;&amp;&gt;/);
    assert.match(rendered, /🙂/);
    assert.equal(highlight(source, alias), rendered);
  }
});
