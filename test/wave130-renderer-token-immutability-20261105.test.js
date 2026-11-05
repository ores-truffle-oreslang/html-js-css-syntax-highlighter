// Host-only HTML renderer regression; no guest execution or release proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

test('HTML renderer does not mutate frozen caller token array or options', () => {
  const tokens = Object.freeze([
    Object.freeze({ kind: 'plain', value: '<b>&"\'🙂' }),
    Object.freeze({ kind: 'q"><img src=x onerror=1>', value: '<svg>&"\'' }),
  ]);
  const options = Object.freeze({ classPrefix: 'pre&<"' });
  const expected =
    '&lt;b&gt;&amp;&quot;&#039;🙂' +
    '<span class="pre&amp;&lt;&quot;q&quot;&gt;&lt;img src=x onerror=1&gt;">' +
    '&lt;svg&gt;&amp;&quot;&#039;</span>';

  for (let i = 0; i < 8; i++) {
    assert.equal(htmlRenderer.render(tokens, options), expected);
    assert.equal(tokens[0].value, '<b>&"\'🙂');
    assert.equal(tokens[1].kind, 'q"><img src=x onerror=1>');
    assert.equal(options.classPrefix, 'pre&<"');
  }
});
