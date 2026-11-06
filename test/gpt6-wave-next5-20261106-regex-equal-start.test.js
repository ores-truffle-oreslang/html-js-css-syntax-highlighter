import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('equal-start rules preserve original priority and foreign RegExp cursor across repeated Unicode scans', () => {
  const first = /ab/i;
  const second = /AB/g;
  first.lastIndex = 7;
  second.lastIndex = 3;
  const language = createRegexLanguage({
    id: 'next5-equal-start-20261106',
    tokens: [
      { kind: 'first', pattern: first },
      { kind: 'second', pattern: second },
    ],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const samples = [
    'ab', 'AB', 'aB', 'abABaB', '🚀ab\nAB\r\nAВaB', '<&ab>"AB"',
    ...Array.from({ length: 96 }, (_, n) =>
      '🥑'.repeat(n % 6) + 'ab'.repeat(n % 7) + '\r\nAB aB'),
  ];
  for (const source of samples) {
    const expected = (source.match(/ab/gi) ?? []).length;
    const tokens = highlighter.tokenize(source, language.id);
    assert.equal(tokens.map(token => token.value).join(''), source);
    assert.equal(tokens.filter(token => token.kind === 'first').length, expected, source);
    assert.equal(tokens.filter(token => token.kind === 'second').length, 0, source);
    assert.ok(tokens.every(token => token.value.length > 0));
    assert.equal(first.lastIndex, 7);
    assert.equal(second.lastIndex, 3);
    highlighter.highlight(source, language.id);
    assert.equal(first.lastIndex, 7);
    assert.equal(second.lastIndex, 3);
  }
});