import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, escapeHtml} from '../src/core.js';

// Independent scalar-by-scalar HTML escaping; does not call production helper.
function htmlOracle(value) {
  const mapping = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'};
  return Array.from(String(value), ch => Object.hasOwn(mapping, ch) ? mapping[ch] : ch).join('');
}
test('hostile class prefixes and token payloads match an independent HTML oracle', () => {
  const alphabet = ['<', '>', '&', '"', "'", '\0', '\r', '\n', '🌐', '\u2028', 'x', '=', '/', ' '];
  let state = 0x5eed1234;
  const next = () => {state = (Math.imul(state, 1103515245) + 12345) >>> 0; return state;};
  for (let iteration = 0; iteration < 190; iteration++) {
    const input = (len) => {
      let s = '';
      for (let j = 0; j < len; j++) s += alphabet[next() % alphabet.length];
      return s;
    };
    const prefix = input(1 + iteration % 20);
    const kind = 'tag' + input(2 + iteration % 13);
    const plain = input(20 + iteration % 31);
    const content = input(17 + iteration % 21);
    const tokens = Object.freeze([
      Object.freeze({kind: 'plain', value: plain}),
      Object.freeze({kind, value: content}),
      Object.freeze({kind: 'plain', value: plain}),
    ]);
    const expected = htmlOracle(plain)
      + '<span class="' + htmlOracle(prefix + kind) + '">' + htmlOracle(content) + '</span>'
      + htmlOracle(plain);
    assert.equal(htmlRenderer.render(tokens, {classPrefix: prefix}), expected);
    assert.equal(htmlRenderer.render(tokens, {classPrefix: prefix}), expected);
    assert.equal(escapeHtml(content), htmlOracle(content));
    assert.equal(tokens[1].value, content);
    assert.equal(tokens[1].kind, kind);
  }
});
