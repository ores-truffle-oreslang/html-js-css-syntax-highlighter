import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/index.js';

test('equal-start regex choices obey rule order and preserve every original source unit', () => {
  const primary = /TOKEN/g;
  primary.lastIndex = 3;
  const secondary = /TOKEN/g;
  secondary.lastIndex = 2;
  const grammar = createRegexLanguage({
    id: 'wave1611-priority',
    tokens: [
      {kind: 'priority', pattern: primary},
      {kind: 'shadow', pattern: secondary},
      {kind: 'case', pattern: /alpha/i},
      {kind: 'newline', pattern: /A.B/s},
    ],
  });
  for (const source of ['TOKEN', 'TOKEN alpha A\nB TOKEN', '\u{1F98A} TOKEN TOKEN\r\n']) {
    const output = grammar.tokenize(source);
    assert.equal(output.map(t => t.value).join(''), source);
    assert.deepEqual(output.filter(t => t.kind === 'shadow'), []);
    assert.equal(output.filter(t => t.kind === 'priority').length,
      source.split('TOKEN').length - 1);
    assert.deepEqual(grammar.tokenize(source), output, 'replay changes token priority');
  }
  assert.equal(primary.lastIndex, 3);
  assert.equal(secondary.lastIndex, 2);
  const special = grammar.tokenize('alpha A\nB').filter(t => t.kind !== 'plain');
  assert.deepEqual(special, [{kind:'case',value:'alpha'},{kind:'newline',value:'A\nB'}]);
});
