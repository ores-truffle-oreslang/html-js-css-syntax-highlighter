import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, escapeHtml} from '../src/core.js';

test('HTML renderer escapes frozen value, kind and prefix without mutating inputs', () => {
  const hostile = Object.freeze({kind: 'k"<&\'', value: '&<>"\'🥑'});
  const plain = Object.freeze({kind: 'plain', value: 17});
  const tokens = Object.freeze([hostile, plain]);
  const options = Object.freeze({classPrefix: 'x\''});
  const expected =
    '<span class="x&#039;k&quot;&lt;&amp;&#039;">' +
    '&amp;&lt;&gt;&quot;&#039;🥑</span>17';
  for (let i = 0; i < 30; i++) {
    assert.equal(htmlRenderer.render(tokens, options), expected);
    assert.equal(escapeHtml('&<>"\'🥑'),
      '&amp;&lt;&gt;&quot;&#039;🥑');
  }
  assert.deepEqual(tokens, [hostile, plain]);
  assert.equal(options.classPrefix, 'x\'');
  assert.equal(htmlRenderer.render(Object.freeze([
    Object.freeze({kind: 'plain', value: '&'})])),
    '&amp;');
});
