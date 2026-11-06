import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('Unicode, adjacent multi-rule matches, and CRLF conserve exact source', () => {
  const grammar = createRegexLanguage({
    id: 'wave6207-unicode',
    tokens: [
      { kind: 'full', pattern: /猫猫/u },
      { kind: 'unit', pattern: /猫/u },
      { kind: 'smile', pattern: /🙂/u },
    ],
  });
  const source = '𝄞猫猫\r\n🙂猫🙂';
  const expected = [
    { kind: 'plain', value: '𝄞' },
    { kind: 'full', value: '猫猫' },
    { kind: 'plain', value: '\r\n' },
    { kind: 'smile', value: '🙂' },
    { kind: 'unit', value: '猫' },
    { kind: 'smile', value: '🙂' },
  ];
  for (let round = 0; round < 8; round++) {
    const result = grammar.tokenize(source);
    assert.deepEqual(result, expected);
    assert.equal(result.map(token => token.value).join(''), source);
    assert.ok(result.every(token => token.value.length > 0));
  }
});

test('same-offset overlap follows source grammar declaration, not match length', () => {
  const source = '猫猫';
  const longerFirst = createRegexLanguage({
    id: 'wave6207-longer-first',
    tokens: [
      { kind: 'pair', pattern: /猫猫/u },
      { kind: 'single', pattern: /猫/u },
    ],
  });
  const shorterFirst = createRegexLanguage({
    id: 'wave6207-shorter-first',
    tokens: [
      { kind: 'single', pattern: /猫/u },
      { kind: 'pair', pattern: /猫猫/u },
    ],
  });
  assert.deepEqual(longerFirst.tokenize(source), [{ kind: 'pair', value: source }]);
  assert.deepEqual(shorterFirst.tokenize(source), [
    { kind: 'single', value: '猫' },
    { kind: 'single', value: '猫' },
  ]);
});
