// Source-owned HTML renderer boundary check, not compiler/backend parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

test('HTML renderer accepts frozen Unicode tokens/options and never mutates them', () => {
  const tokens = Object.freeze([
    Object.freeze({ kind: 'tag" onfocus="attack', value: '&<>"\'\u2028🙂' }),
    Object.freeze({ kind: 'plain', value: '</span><script>x</script>\u2029' }),
    Object.freeze({ kind: 'keyword', value: 'βe\u0301' }),
  ]);
  const options = Object.freeze({ classPrefix: 'p<>&' });
  const expected = '<span class="p&lt;&gt;&amp;tag&quot; onfocus=&quot;attack">' +
    '&amp;&lt;&gt;&quot;&#039;\u2028🙂</span>' +
    '&lt;/span&gt;&lt;script&gt;x&lt;/script&gt;\u2029' +
    '<span class="p&lt;&gt;&amp;keyword">βe\u0301</span>';
  for (let repeat = 0; repeat < 3; repeat += 1) {
    const output = htmlRenderer.render(tokens, options);
    assert.equal(output, expected);
    assert.doesNotMatch(output, /<script|<\/span><script|onfocus="attack"/);
    assert.equal(tokens[0].kind, 'tag" onfocus="attack');
  }
});
