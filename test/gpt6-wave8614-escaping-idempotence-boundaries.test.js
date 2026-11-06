import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml, htmlRenderer} from '../src/core.js';

// Host HTML renderer boundary: no compiled AttoLang guest is exercised.
test('entity-like caller source is escaped on every render without becoming trusted HTML', () => {
  const original = '&amp;<img src="x" onerror=\'evil\'> 🍓';
  const expected = '&amp;amp;&lt;img src=&quot;x&quot; onerror=&#039;evil&#039;&gt; 🍓';
  assert.equal(escapeHtml(original), expected);
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: original}),
    Object.freeze({kind: 'tag" onclick="bad', value: '<svg>&"\'🍓'}),
  ]);
  const options = Object.freeze({classPrefix: 'safe-<"data=">'});
  const expectedSecond = '<span class="safe-&lt;&quot;data=&quot;&gt;tag&quot; onclick=&quot;bad">' +
    '&lt;svg&gt;&amp;&quot;&#039;🍓</span>';
  const wanted = expected + expectedSecond;
  for (let n = 0; n < 6; n++) {
    const rendered = htmlRenderer.render(tokens, options);
    assert.equal(rendered, wanted);
    assert.equal(rendered.includes('<svg>'), false);
    assert.equal(rendered.includes('<img'), false);
    assert.equal(rendered.includes('onclick="bad"'), false);
    assert.equal(rendered.includes('onerror=\'evil\''), false);
  }
  assert.equal(tokens[0].value, original);
  assert.equal(tokens[1].kind, 'tag" onclick="bad');
  assert.equal(options.classPrefix, 'safe-<"data=">');
});
