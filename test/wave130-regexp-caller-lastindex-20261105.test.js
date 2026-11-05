// Host-only source-owned lexer regression; not a compiler guest test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('compiled rules do not execute or reset the caller-owned RegExp', () => {
  const external = /task/gi;
  external.lastIndex = 4;
  const language = createRegexLanguage({
    id: 'wave130-caller-regexp-state',
    tokens: [
      { kind: 'keyword', pattern: external },
      { kind: 'punct', pattern: /!/g },
    ],
  });
  const source = 'Task task!';
  const expected = [
    { kind: 'keyword', value: 'Task' },
    { kind: 'plain', value: ' ' },
    { kind: 'keyword', value: 'task' },
    { kind: 'punct', value: '!' },
  ];
  assert.equal(external.lastIndex, 4);
  for (let i = 0; i < 32; i++) {
    assert.deepEqual(language.tokenize(source), expected);
    assert.equal(external.lastIndex, 4);
  }
  external.lastIndex = 999;
  assert.deepEqual(language.tokenize(source), expected);
  assert.equal(external.lastIndex, 999);
  assert.equal(language.tokenize(source).map(token => token.value).join(''), source);
});
