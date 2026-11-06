import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, htmlRenderer, escapeHtml } from '../src/core.js';

test('frozen hostile tokens cannot break out of HTML class attribute or plain content', () => {
  const hostile = Object.freeze({ kind: 'tag"><img src=x onerror=alert(1)>', value: '<svg/onload="boom">&\'' });
  const plain = Object.freeze({ kind: 'plain', value: '<script>alert("&")</script>\u0000' });
  const tokens = Object.freeze([hostile, plain]);
  const prefix = 'a" autofocus onfocus="evil<&\'';
  const options = Object.freeze({ classPrefix: prefix });
  let tokenizations = 0;
  const grammar = Object.freeze({
    kind: 'language', id: 'tainted', aliases: Object.freeze(['tainted-alias']),
    tokenize(code) {
      assert.equal(code, 'source');
      tokenizations++;
      return tokens;
    }
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const expected = '<span class="' + escapeHtml(prefix + hostile.kind) + '">' +
    escapeHtml(hostile.value) + '</span>' + escapeHtml(plain.value);

  for (const name of ['tainted', 'tainted-alias', 'tainted']) {
    const output = highlighter.highlight('source', name, options);
    assert.equal(output, expected);
    assert.ok(!output.includes('<svg'));
    assert.ok(!output.includes('<script'));
    assert.ok(!output.includes('onfocus="evil'));
    assert.ok(!output.includes('onerror=alert(1)>'));
    assert.equal((output.match(/<span/g) || []).length, 1);
  }
  assert.equal(tokenizations, 3);
  assert.deepEqual(tokens, [hostile, plain], 'rendering must never mutate frozen tokens');
  assert.equal(htmlRenderer.render(tokens, options), expected);
});
