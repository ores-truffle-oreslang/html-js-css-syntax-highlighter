import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('earliest offset wins, equal-offset tie follows grammar order', () => {
  const lang = createRegexLanguage({
    id: 'wave610-overlap',
    tokens: [
      { kind: 'whole', pattern: /猫😺/u },
      { kind: 'prefix', pattern: /猫/u },
      { kind: 'suffix', pattern: /😺/u },
    ],
  });
  const source = '😀猫😺\r\n猫😺猫';
  const expected = [
    { kind: 'plain', value: '😀' },
    { kind: 'whole', value: '猫😺' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'whole', value: '猫😺' },
    { kind: 'prefix', value: '猫' },
  ];
  assert.deepEqual(lang.tokenize(source), expected);
  assert.equal(expected.map(token => token.value).join(''), source);
  for (let index = 0; index < 5; index++) {
    assert.deepEqual(lang.tokenize(source), expected);
  }
});

test('earliest shorter match beats a later longer match and still conserves gaps', () => {
  const lang = createRegexLanguage({
    id: 'wave610-offset-priority',
    tokens: [
      { kind: 'later-longer', pattern: /猫猫/u },
      { kind: 'earlier-short', pattern: /😺/u },
    ],
  });
  const source = '😀😺猫猫';
  const result = lang.tokenize(source);
  assert.deepEqual(result, [
    { kind: 'plain', value: '😀' },
    { kind: 'earlier-short', value: '😺' },
    { kind: 'later-longer', value: '猫猫' },
  ]);
  assert.equal(result.map(token => token.value).join(''), source);
});
