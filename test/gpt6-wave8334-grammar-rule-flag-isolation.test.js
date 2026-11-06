import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Host grammar flag and source partition tests; not AttoLang guest execution.
test('independent ignoreCase and dotAll rule flags retain leftmost precedence', () => {
  const caseOnly = /ab/i;
  caseOnly.lastIndex = 301;
  const dotOnly = /x.y/s;
  dotOnly.lastIndex = 991;
  const literal = /AB/;
  const language = createRegexLanguage({
    id: 'gpt6-wave8334-flags',
    tokens: [
      {kind: 'case', pattern: caseOnly},
      {kind: 'dot', pattern: dotOnly},
      {kind: 'literal', pattern: literal},
    ],
  });
  const input = 'Ab|x\ny|AB|ab|xzy|x\r\ny';
  const expected = [
    ['case', 'Ab'], ['plain', '|'], ['dot', 'x\ny'],
    ['plain', '|'], ['case', 'AB'], ['plain', '|'],
    ['case', 'ab'], ['plain', '|'], ['dot', 'xzy'],
    ['plain', '|'], ['dot', 'x\r\n'], ['plain', 'y'],
  ];
  for (let iteration = 0; iteration < 5; iteration++) {
    const actual = language.tokenize(input);
    assert.deepEqual(actual.map(t => [t.kind, t.value]), expected);
    assert.equal(actual.map(t => t.value).join(''), input);
    assert.equal(caseOnly.lastIndex, 301);
    assert.equal(dotOnly.lastIndex, 991);
  }
  // Neither flags nor caller cursor state should bleed into other rules.
  assert.deepEqual(language.tokenize('AB\nx\ny').map(t => [t.kind, t.value]), [
    ['case', 'AB'], ['plain', '\n'], ['dot', 'x\ny'],
  ]);
});
