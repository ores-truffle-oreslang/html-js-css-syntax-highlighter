import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('zero-width rules cannot loop or split an astral scalar while real matches survive', () => {
  const language = createRegexLanguage({
    id: 'wave8110-progress',
    tokens: [
      { kind: 'empty', pattern: /^|(?=猫)/u },
      { kind: 'cat', pattern: /猫/u },
    ],
  });
  const source = '😀猫\r\n😀猫';
  const expected = [
    { kind: 'plain', value: '😀' },
    { kind: 'cat', value: '猫' },
    { kind: 'plain', value: '\r\n😀' },
    { kind: 'cat', value: '猫' },
  ];
  for (let i = 0; i < 8; i++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(t => t.value).join(''), source);
    assert.ok(actual.every(t => t.value.length > 0));
  }
});

test('a grammar containing only zero-width matches returns the entire source unchanged', () => {
  const language = createRegexLanguage({
    id: 'wave8110-empty-only',
    tokens: [{ kind: 'none', pattern: /(?=.)/u }],
  });
  for (const source of ['😀', '🙂\r\n猫', 'alpha beta', '']) {
    const output = language.tokenize(source);
    if (source) assert.deepEqual(output, [{ kind: 'plain', value: source }]);
    else assert.deepEqual(output, []);
  }
});
