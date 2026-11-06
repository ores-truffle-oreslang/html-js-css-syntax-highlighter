import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

// Static literal oracle: HTML markup/text/attribute encoding is independently asserted.
test('frozen hostile token metadata cannot inject attributes or unescaped HTML', () => {
  const tokens = Object.freeze([
    Object.freeze({kind:'plain',value:'💠<&"'}),
    Object.freeze({kind:'evil" onclick="run()',value:'&"\'<'}),
  ]);
  const options = Object.freeze({classPrefix:'q" data-z="'});
  const expected = '💠&lt;&amp;&quot;' +
    '<span class="q&quot; data-z=&quot;evil&quot; onclick=&quot;run()">&amp;&quot;&#039;&lt;</span>';
  for (let i=0;i<12;i++) {
    const actual = htmlRenderer.render(tokens,options);
    assert.equal(actual,expected);
    assert.equal(actual.includes('onclick="run()'),false);
    assert.equal(actual.includes('data-z="evil'),false);
    assert.equal(htmlRenderer.render(tokens),
      '💠&lt;&amp;&quot;<span class="tok-evil&quot; onclick=&quot;run()">&amp;&quot;&#039;&lt;</span>');
    assert.equal(tokens[1].kind,'evil" onclick="run()');
    assert.equal(options.classPrefix,'q" data-z="');
  }
});

test('a plain token is escaped without being wrapped in untrusted span metadata', () => {
  const tokens=Object.freeze([Object.freeze({kind:'plain',value:'<script>"&\'</script>'})]);
  assert.equal(htmlRenderer.render(tokens,Object.freeze({classPrefix:'" onmouseover="evil'})),
    '&lt;script&gt;&quot;&amp;&#039;&lt;/script&gt;');
});
