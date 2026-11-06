import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

test('quoted symbols distinguish valid escapes from malformed opaque regions', () => {
  const cases = [
    ['#"alpha\u0042"', 'symbol'],
    ["#'abc\\'def'", 'symbol'],
    ['#"bad\\qreturn"', 'plain'],
    ['#"bad\\uZZZZreturn"', 'plain'],
    ['#"has space return"', 'symbol'],
  ];
  for (const [source, kind] of cases) {
    const tokens = oreslang.tokenize(source);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.deepEqual(tokens, [{kind, value: source}]);
    assert.deepEqual(oreslang.tokenize(source), tokens);
  }
});
