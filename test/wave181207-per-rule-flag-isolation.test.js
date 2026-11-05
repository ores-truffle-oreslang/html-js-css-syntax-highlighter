import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Source-owned JS tokenizer coverage; not an AttoLang guest or compiler test.
test('case folding and dotAll are isolated to each rule across repeated calls', () => {
  const language = createRegexLanguage({
    id: 'wave181207-isolated-flags',
    tokens: [
      {kind: 'strict', pattern: /FOO/},
      {kind: 'fold', pattern: /bar/i},
      {kind: 'multiline', pattern: /x.y/s},
    ],
  });
  const source = 'foo BAR x\ny FOO bar X\ny';
  const expected = [
    {kind: 'plain', value: 'foo '},
    {kind: 'fold', value: 'BAR'},
    {kind: 'plain', value: ' '},
    {kind: 'multiline', value: 'x\ny'},
    {kind: 'plain', value: ' '},
    {kind: 'strict', value: 'FOO'},
    {kind: 'plain', value: ' '},
    {kind: 'fold', value: 'bar'},
    {kind: 'plain', value: ' X\ny'},
  ];
  for (let n = 0; n < 12; n++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), source);
    assert.ok(actual.every(token => token.value.length > 0));
  }
});
