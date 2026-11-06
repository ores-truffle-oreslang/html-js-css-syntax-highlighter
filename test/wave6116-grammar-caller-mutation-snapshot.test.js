// Host-level lexical trust boundary; not a guest-compiler result.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('compiled grammar and registered names are independent of caller mutations', () => {
  const caseFolded = /[a-z]+/i;
  const originalLastIndex = 57;
  caseFolded.lastIndex = originalLastIndex;
  const rules = [
    {kind: 'word', pattern: caseFolded},
    {kind: 'newline', pattern: /\r\n/},
  ];
  const aliases = ['wave6116-stable'];
  const plugin = createRegexLanguage({id: 'wave6116-primary', aliases, tokens: rules});
  const highlighter = new SyntaxHighlighter({languages: [plugin]});
  aliases[0] = 'wave6116-forged';
  rules[0].kind = 'injected';
  rules[0].pattern = /MALICIOUS/;
  rules.push({kind: 'also-forged', pattern: /🙂/u});
  caseFolded.lastIndex = 999999;
  plugin.aliases[0] = 'wave6116-late-forged';

  assert.equal(highlighter.language('wave6116-stable'), plugin);
  assert.equal(highlighter.language('wave6116-forged'), undefined);
  assert.equal(highlighter.language('wave6116-late-forged'), undefined);
  const source = '🙂ABC\r\nx&<def';
  const expected = [
    {kind: 'plain', value: '🙂'},
    {kind: 'word', value: 'ABC'},
    {kind: 'newline', value: '\r\n'},
    {kind: 'word', value: 'x'},
    {kind: 'plain', value: '&<'},
    {kind: 'word', value: 'def'},
  ];
  for (let iteration = 0; iteration < 24; iteration++) {
    const name = iteration % 2 ? 'wave6116-primary' : 'wave6116-stable';
    assert.deepEqual(highlighter.tokenize(source, name), expected);
    assert.equal(highlighter.tokenize(source, name).map(t => t.value).join(''), source);
    assert.equal(caseFolded.lastIndex, 999999, 'scanner must not mutate original regex');
  }
});
