// Source-owned host regex scanner contracts; no compiled AttoLang guest evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('case-folding and dotAll are isolated per rule across Unicode gaps and reuse', () => {
  const caller = /b/i;
  caller.lastIndex = 23;
  const rules = [
    {kind: 'exact', pattern: /B/},
    {kind: 'fold', pattern: caller},
    {kind: 'dotall', pattern: /x.y/s},
    {kind: 'no-dotall', pattern: /m.n/},
    {kind: 'astral', pattern: /💠/u},
  ];
  const language = createRegexLanguage({id: 'wave2032-flags', tokens: rules});
  const source = 'b B x\ny m\nn 💠';
  const expected = [
    {kind: 'fold', value: 'b'},
    {kind: 'plain', value: ' '},
    {kind: 'exact', value: 'B'},
    {kind: 'plain', value: ' '},
    {kind: 'dotall', value: 'x\ny'},
    {kind: 'plain', value: ' m\nn '},
    {kind: 'astral', value: '💠'},
  ];
  for (let i = 0; i < 25; i++) {
    const tokens = language.tokenize(source);
    assert.deepEqual(tokens, expected, 'repeated scan ' + i);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.ok(tokens.every(token => token.value.length > 0));
    assert.deepEqual(language.tokenize('m\nn'), [{kind: 'plain', value: 'm\nn'}]);
  }
  assert.equal(caller.lastIndex, 23, 'registered pattern must not mutate caller cursor');
  assert.deepEqual(language.tokenize('B b'), [
    {kind: 'exact', value: 'B'},
    {kind: 'plain', value: ' '},
    {kind: 'fold', value: 'b'},
  ]);
});
