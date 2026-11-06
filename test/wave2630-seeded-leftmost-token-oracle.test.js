import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// An independent source-scalar scanner: no RegExp matcher reused from production.
function reference(source) {
  const out = [];
  let plain = '';
  const flush = () => { if (plain) { out.push({kind: 'plain', value: plain}); plain = ''; } };
  for (let i = 0; i < source.length;) {
    const at = source.slice(i);
    let value = '', kind = '';
    if (/^[0-9]/.test(at)) {
      kind = 'digits';
      let n = 0;
      while (n < at.length && at[n] >= '0' && at[n] <= '9') n++;
      value = at.slice(0, n);
    } else if (at.length >= 2 && at[0].toLowerCase() === 'a' && at[1].toLowerCase() === 'b') {
      kind = 'word'; value = at.slice(0, 2);
    } else if (at.startsWith('\r\n')) {
      kind = 'crlf'; value = '\r\n';
    } else if (at.startsWith('🌐')) {
      kind = 'planet'; value = '🌐';
    } else if (at.startsWith('\n')) {
      kind = 'lf'; value = '\n';
    }
    if (value) { flush(); out.push({kind, value}); i += value.length; }
    else {
      const step = source.codePointAt(i) > 0xffff ? 2 : 1;
      plain += source.slice(i, i + step);
      i += step;
    }
  }
  flush();
  return out;
}
function* sources() {
  let seed = 0x123ad00d;
  const alphabet = ['🌐', 'A', 'b', 'a', 'B', '7', '8', '0', '\r', '\n', '-', 'x', '\0', '<', '&'];
  for (let sample = 0; sample < 180; sample++) {
    let input = '';
    for (let i = 0; i < 32 + (sample % 15); i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      input += alphabet[seed % alphabet.length];
    }
    yield input;
  }
}
test('seeded leftmost-rule oracle conserves complete Unicode/CRLF input and tie precedence', () => {
  const caller = /[0-9]+/g;
  caller.lastIndex = 431;
  const lexer = createRegexLanguage({id: 'wave2630-leftmost', tokens: [
    {kind: 'zero', pattern: /(?=7)/},
    {kind: 'digits', pattern: caller},
    {kind: 'word', pattern: /ab/i},
    {kind: 'crlf', pattern: /\r\n/},
    {kind: 'planet', pattern: /🌐/u},
    {kind: 'single-seven', pattern: /7/},
    {kind: 'lf', pattern: /\n/},
  ]});
  for (const input of sources()) {
    const expected = reference(input);
    for (let repeat = 0; repeat < 3; repeat++) {
      const actual = lexer.tokenize(input);
      assert.deepEqual(actual, expected);
      assert.equal(actual.map(t => t.value).join(''), input);
      assert.ok(actual.every(t => t.value.length > 0));
      assert.equal(caller.lastIndex, 431, 'caller regex cursor leaked');
    }
  }
});
