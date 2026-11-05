import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Independent deterministic literal-token reference model. Host lexer only.
const rules = [
  {kind: 'long', text: 'abc', pattern: /abc/},
  {kind: 'short', text: 'ab', pattern: /ab/},
  {kind: 'astral', text: '💠z', pattern: /💠z/u},
  {kind: 'newline', text: '\r\n', pattern: /\r\n/},
  {kind: 'angle', text: '<&', pattern: /<&/},
];
function reference(source) {
  const result = [];
  let cursor = 0;
  while (cursor < source.length) {
    let selected = -1;
    let start = Infinity;
    for (let i = 0; i < rules.length; i++) {
      const index = source.indexOf(rules[i].text, cursor);
      if (index >= 0 && index < start) { selected = i; start = index; }
    }
    if (selected < 0) { result.push({kind: 'plain', value: source.slice(cursor)}); break; }
    if (start > cursor) result.push({kind: 'plain', value: source.slice(cursor, start)});
    result.push({kind: rules[selected].kind, value: rules[selected].text});
    cursor = start + rules[selected].text.length;
  }
  return result;
}
test('seeded earliest-match and tie-priority reference preserves UTF-16 source', () => {
  const lexer = createRegexLanguage({id: 'wave2001-oracle', tokens: rules.map(r => ({
    kind: r.kind, pattern: r.pattern
  }))});
  const pieces = ['a', 'b', 'c', 'abc', 'ab', '💠', 'z', '\r', '\n', '\r\n', '<', '&', '<&', "'", '☃'];
  let state = 0x2001a11;
  const next = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state; };
  for (let sample = 0; sample < 200; sample++) {
    let source = '';
    for (let i = 0; i < 48; i++) source += pieces[next() % pieces.length];
    const expected = reference(source);
    for (let call = 0; call < 3; call++) {
      const actual = lexer.tokenize(source);
      assert.deepEqual(actual, expected, 'sample ' + sample);
      assert.equal(actual.map(t => t.value).join(''), source);
      assert.ok(actual.every(t => t.value.length > 0));
    }
  }
});
