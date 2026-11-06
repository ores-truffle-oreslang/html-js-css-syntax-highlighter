import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

// Bounded, source-owned highlighting oracle: never promote to parser proof.
test('nested comments and malformed quoted Symbols do not leak inner keywords', () => {
  const comment = '/* outer /* let return */ still critical */';
  const invalidSymbol = String.raw`#"bad\xreturn"`;
  const input = comment + '\r\n' + invalidSymbol + '\r\nconst ok = #"name";';
  for (let i=0; i<6; i++) {
    const tokens = oreslang.tokenize(input);
    assert.equal(tokens.map(t => t.value).join(''), input);
    assert.ok(tokens.some(t => t.kind === 'comment' && t.value === comment));
    assert.ok(tokens.some(t => t.kind === 'plain' && t.value === invalidSymbol));
    assert.ok(tokens.some(t => t.kind === 'symbol' && t.value === '#"name"'));
    assert.deepEqual(tokens.filter(t=>t.kind === 'keyword').map(t=>t.value), ['const']);
  }
});

test('three nested comment levels recover exactly at the outer closing delimiter', () => {
  const source = '/* alpha /* beta /* gamma */ delta */ epsilon */\r\nreturn 3;';
  const tokens = oreslang.tokenize(source);
  assert.equal(tokens.map(t=>t.value).join(''), source);
  assert.equal(tokens.filter(t=>t.kind === 'comment').length, 1);
  assert.deepEqual(tokens.filter(t=>t.kind === 'keyword').map(t=>t.value), ['return']);
});
