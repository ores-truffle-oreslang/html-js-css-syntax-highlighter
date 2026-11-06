import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer} from '../src/core.js';

// Host HTML rendering boundary, not native guest or compiler conformance.
test('frozen hostile token metadata stays escaped under interleaved rendering options', () => {
  const body = '<script>💠&"\'\0</script>';
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: body}),
    Object.freeze({kind: 'danger" onclick="evil', value: '<&>"\'💠'}),
  ]);
  const escapedBody = '&lt;script&gt;💠&amp;&quot;&#039;\0&lt;/script&gt;';
  const escapedToken = '&lt;&amp;&gt;&quot;&#039;💠';
  const optionsA = Object.freeze({classPrefix: 'a" onmouseover="bad-'});
  const optionsB = Object.freeze({classPrefix: 'b<danger>-'});

  for (let round = 0; round < 5; round++) {
    const a = htmlRenderer.render(tokens, optionsA);
    const b = htmlRenderer.render(tokens, optionsB);
    assert.equal(a, escapedBody +
      '<span class="a&quot; onmouseover=&quot;bad-danger&quot; onclick=&quot;evil">' +
      escapedToken + '</span>');
    assert.equal(b, escapedBody +
      '<span class="b&lt;danger&gt;-danger&quot; onclick=&quot;evil">' +
      escapedToken + '</span>');
    for (const output of [a, b]) {
      assert.ok(!output.includes('<script>'));
      assert.ok(!output.includes('onclick="evil"'));
      assert.ok(!output.includes('onmouseover="bad-'));
    }
  }
  assert.equal(tokens[0].value, body);
  assert.equal(tokens[1].kind, 'danger" onclick="evil');
  assert.equal(optionsA.classPrefix, 'a" onmouseover="bad-');
});
