import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('compiled rules retain per-rule case/dotAll flags without mutating caller regex', () => {
  const multiline = /a.b/isg;
  const strict = /Z/g;
  multiline.lastIndex = 8;
  strict.lastIndex = 4;
  const grammar = createRegexLanguage({
    id: 'gpt6-wave2140-flags', aliases: ['g2140-flags'],
    tokens: [
      {kind: 'multiline', pattern: multiline},
      {kind: 'strict', pattern: strict},
      {kind: 'lower', pattern: /x/}
    ]
  });
  const h = new SyntaxHighlighter({languages:[grammar]});
  const source = 'a\nB\r\nz x\r\n🧪A\nb';
  const expected = [
    {kind:'multiline', value:'a\nB'},
    {kind:'plain', value:'\r\nz '},
    {kind:'lower', value:'x'},
    {kind:'plain', value:'\r\n🧪'},
    {kind:'multiline', value:'A\nb'}
  ];
  for (let repeat=0; repeat<16; repeat++) {
    const tokens=h.tokenize(source,'g2140-flags');
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(t=>t.value).join(''),source);
    assert.equal(multiline.lastIndex,8);
    assert.equal(strict.lastIndex,4);
  }
  assert.deepEqual(h.tokenize('Zz',grammar.id), [
    {kind:'strict',value:'Z'}, {kind:'plain',value:'z'}
  ], 'case sensitivity must remain local to each rule');
});
