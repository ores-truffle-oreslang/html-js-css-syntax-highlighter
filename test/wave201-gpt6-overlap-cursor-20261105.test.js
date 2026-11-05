import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('equal-index regex overlaps retain declared priority across repeated scans', () => {
  const grammar = createRegexLanguage({
    id: 'wave201-overlap',
    tokens: [
      { kind: 'preferred', pattern: /ab/ },
      { kind: 'shadowed', pattern: /ab/ },
      { kind: 'terminal', pattern: /z/ },
    ],
  });
  const source = 'abz ab🙂ab';
  const expected = [
    {kind:'preferred',value:'ab'}, {kind:'terminal',value:'z'},
    {kind:'plain',value:' '}, {kind:'preferred',value:'ab'},
    {kind:'plain',value:'🙂'}, {kind:'preferred',value:'ab'},
  ];
  for (let i = 0; i < 4; i++) {
    assert.deepEqual(grammar.tokenize(source), expected);
    assert.equal(grammar.tokenize(source).map(x=>x.value).join(''), source);
    assert.deepEqual(grammar.tokenize('!'), [{kind:'plain',value:'!'}]);
  }
});
