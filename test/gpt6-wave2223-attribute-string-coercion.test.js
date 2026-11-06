import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer } from '../src/core.js';

// Prefixes and values may be caller-owned objects. Coercion must stay inside
// the HTML escaping boundary, including for frozen token arrays.
test('class and token value coercions escape once without mutating caller inputs', () => {
  const rawPrefix = 'p" onmouseover="<img src=x>&';
  const rawValue = '"<&\'' + '\u2028' + '𝒜';
  let prefixReads = 0;
  let valueReads = 0;
  const prefix = Object.freeze({
    [Symbol.toPrimitive]() { prefixReads++; return rawPrefix; },
  });
  const value = Object.freeze({
    [Symbol.toPrimitive]() { valueReads++; return rawValue; },
  });
  const tokens = Object.freeze([
    Object.freeze({ kind: 'plain', value: '<&' }),
    Object.freeze({ kind: 'keyword', value }),
  ]);
  const options = Object.freeze({ classPrefix: prefix });
  const expected = '&lt;&amp;' +
    '<span class="p&quot; onmouseover=&quot;&lt;img src=x&gt;&amp;keyword">' +
    '&quot;&lt;&amp;&#039;\u2028𝒜</span>';

  for (let i = 1; i <= 3; i++) {
    const result = htmlRenderer.render(tokens, options);
    assert.equal(result, expected);
    assert.equal(prefixReads, i, 'one prefix coercion per marked token');
    assert.equal(valueReads, i, 'one value coercion per marked token');
    assert.ok(!result.includes('onmouseover="<img'));
    assert.ok(!result.includes('<img src=x>'));
    assert.equal(tokens[0].value, '<&');
    assert.equal(options.classPrefix, prefix);
  }
});
