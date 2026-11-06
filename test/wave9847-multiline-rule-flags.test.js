import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('multiline anchored and case-folded patterns remain independently scoped', () => {
  const anchored = /^foo$/m;
  anchored.lastIndex = 27;
  const language = createRegexLanguage({
    id: 'wave9847-multiline',
    tokens: [
      {kind:'line', pattern:anchored},
      {kind:'case-folded', pattern:/foo/i},
      {kind:'dotall', pattern:/x.y/s},
      {kind:'no-dotall', pattern:/x.y/},
    ],
  });
  const source = 'z\r\nfoo\nFoo\nx\ny';
  const expected = [
    {kind:'plain', value:'z\r\n'},
    {kind:'line', value:'foo'},
    {kind:'plain', value:'\n'},
    {kind:'case-folded', value:'Foo'},
    {kind:'plain', value:'\n'},
    {kind:'dotall', value:'x\ny'},
  ];
  for (let i=0; i<25; i++) {
    const got = language.tokenize(source);
    assert.deepEqual(got, expected);
    assert.equal(got.map(t=>t.value).join(''), source);
    assert.equal(anchored.lastIndex, 27);
  }
  assert.deepEqual(language.tokenize('FOO'), [{kind:'case-folded', value:'FOO'}]);
  assert.deepEqual(language.tokenize('foo'), [{kind:'line', value:'foo'}]);
});
