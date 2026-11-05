import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('overlapping keyword/word rules preserve all source scalars and precedence', () => {
  const language = createRegexLanguage({
    id: 'wave42-source-preservation',
    tokens: [
      { kind: 'keyword', pattern: /\btask\b/ },
      { kind: 'word', pattern: /[A-Za-z]+/ },
      { kind: 'punct', pattern: /[!?]/ },
    ],
  });
  const source = 'task tasks🙂task!\nTask?';
  const expected = [
    { kind: 'keyword', value: 'task' },
    { kind: 'plain', value: ' ' },
    { kind: 'word', value: 'tasks' },
    { kind: 'plain', value: '🙂' },
    { kind: 'keyword', value: 'task' },
    { kind: 'punct', value: '!' },
    { kind: 'plain', value: '\n' },
    { kind: 'word', value: 'Task' },
    { kind: 'punct', value: '?' },
  ];
  for (let i = 0; i < 12; i++) {
    const actual = language.tokenize(source);
    assert.deepEqual(actual, expected);
    assert.equal(actual.map(token => token.value).join(''), source);
  }
});

test('zero-width competitor never consumes or duplicates adjacent astral source', () => {
  const language = createRegexLanguage({
    id: 'wave42-zero-width',
    tokens: [
      { kind: 'empty', pattern: /(?=a)/ },
      { kind: 'word', pattern: /a+/ },
    ],
  });
  const source = '🙂aa🙂a';
  assert.deepEqual(language.tokenize(source), [
    { kind: 'plain', value: '🙂' },
    { kind: 'word', value: 'aa' },
    { kind: 'plain', value: '🙂' },
    { kind: 'word', value: 'a' },
  ]);
});