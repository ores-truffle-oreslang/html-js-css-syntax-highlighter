import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

// Independent escaping oracle: do not call the implementation's escapeHtml.
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

test('untrusted token kind and class prefix remain quoted attribute data', () => {
  const prefix = 'pre" tabindex="0" onclick="bad<&\'';
  const kind = 'name" onmouseenter="bad\'<&>';
  const hostile = '\u00e9💠<&"\'\r\n\0';
  const tokens = Object.freeze([
    Object.freeze({ kind: 'plain', value: hostile }),
    Object.freeze({ kind, value: '<script>"\u00e9&' }),
    Object.freeze({ kind: 'plain', value: hostile }),
  ]);
  const expected = esc(hostile)
    + '<span class="' + esc(prefix + kind) + '">' + esc('<script>"\u00e9&') + '</span>'
    + esc(hostile);
  const original = JSON.stringify(tokens);
  for (let n = 0; n < 5; n++) {
    assert.equal(htmlRenderer.render(tokens, { classPrefix: prefix }), expected);
    assert.equal(JSON.stringify(tokens), original);
    assert.equal((expected.match(/<span class="/g) || []).length, 1);
    assert.ok(!expected.includes(' onclick="bad'));
  }
});
