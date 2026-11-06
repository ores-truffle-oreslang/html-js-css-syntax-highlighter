import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

// Host tokenizer admission boundary, not an AttoLang compiler execution proof.
test('4096 nested block comments remain opaque without false keyword leakage', () => {
  const depth = 4096;
  const comment = '/*'.repeat(depth) + 'critical return await'
    + '*/'.repeat(depth);
  const source = comment + '\r\nfnc actual() { return 1; }';
  const out = oreslang.tokenize(source);
  assert.equal(out.map(token => token.value).join(''), source);
  assert.equal(out.filter(token => token.kind === 'comment').length, 1);
  assert.ok(out.some(token => token.kind === 'comment' && token.value === comment));
  assert.deepEqual(out.filter(token => token.kind === 'keyword').map(token => token.value),
    ['fnc', 'return']);
});

test('4097 nested block comments reject whole source without coloring suffix', () => {
  const comment = '/*'.repeat(4097) + 'return critical'
    + '*/'.repeat(4097);
  const source = comment + '\r\nfnc later() { return 1; }';
  for (let i = 0; i < 3; i++) {
    const out = oreslang.tokenize(source);
    assert.deepEqual(out, [{kind: 'plain', value: source}]);
    assert.equal(out.map(token => token.value).join(''), source);
  }
});
