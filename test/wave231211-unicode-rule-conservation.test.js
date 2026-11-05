import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Source-owned lexer regression: no private compiler or guest parity claims.
test('mixed astral, CRLF, zero-width and overlapping rules conserve every source scalar', () => {
  const original = /[0-9]+/g;
  original.lastIndex = 741;
  const grammar = createRegexLanguage({
    id: 'wave231211-unicode-lex',
    tokens: [
      {kind: 'empty', pattern: /(?=🌐)/u},
      {kind: 'number', pattern: original},
      {kind: 'short-number', pattern: /[0-9]/},
      {kind: 'line', pattern: /\r\n|\n|\r/},
      {kind: 'planet', pattern: /🌐/u},
      {kind: 'word', pattern: /ab/i},
    ]
  });
  const cases = [
    ['🌐42\r\nAb\0🌐99', ['planet', 'number', 'line', 'word', 'plain', 'planet', 'number']],
    ['77🌐\n09\r🌐ab', ['number', 'planet', 'line', 'number', 'line', 'planet', 'word']],
    ['\0🌐🌐42\r\nx', ['plain', 'planet', 'planet', 'number', 'line', 'plain']],
    ['ab00\r\n🌐ab', ['word', 'number', 'line', 'planet', 'word']],
  ];
  for (let repetition = 0; repetition < 12; repetition++) {
    for (const [source, kinds] of cases) {
      const actual = grammar.tokenize(source);
      assert.deepEqual(actual.map(({kind}) => kind), kinds);
      assert.equal(actual.map(({value}) => value).join(''), source);
      assert.ok(actual.every(({value}) => value.length > 0));
    }
    assert.equal(original.lastIndex, 741, 'caller regex state must not be modified');
  }
});