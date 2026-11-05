// Host-only HTML renderer regression; no guest compiler or browser parity claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, htmlRenderer } from '../src/core.js';

test('hostile payload escapes identically as plain and marked source', () => {
  const source = '\u003c&"\'>';
  const escaped = '&lt;&amp;&quot;&#039;&gt;';
  assert.equal(escapeHtml(source), escaped);
  assert.equal(htmlRenderer.render([{ kind: 'plain', value: source }]), escaped);
  assert.equal(
    htmlRenderer.render([{ kind: 'keyword', value: source }], { classPrefix: 'k-' }),
    '<span class="k-keyword">' + escaped + '</span>',
  );
});
