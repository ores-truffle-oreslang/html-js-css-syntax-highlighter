import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

test('leftmost rules beat later choices, earliest rule wins same-position ties', () => {
  const caller = /ab/;
  caller.lastIndex = 17;
  const language = createRegexLanguage({
    id: 'wave9847-leftmost',
    tokens: [
      {kind: 'long', pattern: caller},
      {kind: 'tie-loser', pattern: /ab/},
      {kind: 'short', pattern: /a/},
      {kind: 'emoji', pattern: /🥑/u},
    ],
  });
  const source = '🥑zab a ab';
  const expected = [
    {kind: 'emoji', value: '🥑'},
    {kind: 'plain', value: 'z'},
    {kind: 'long', value: 'ab'},
    {kind: 'plain', value: ' '},
    {kind: 'short', value: 'a'},
    {kind: 'plain', value: ' '},
    {kind: 'long', value: 'ab'},
  ];
  for (let i=0; i<40; i++) {
    const result = language.tokenize(source);
    assert.deepEqual(result, expected);
    assert.equal(result.map(t => t.value).join(''), source);
    assert.ok(!result.some(t => t.kind === 'tie-loser'));
    assert.equal(caller.lastIndex, 17);
  }
  assert.deepEqual(language.tokenize('ab'), [{kind: 'long', value:'ab'}]);
});
