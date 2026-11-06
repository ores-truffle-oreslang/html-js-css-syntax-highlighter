import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

// Source-owned editor tokenizer test only, not compiler-backed guest parity.
test('quoted Symbol admission respects the 256-byte canonical UTF-8 boundary', () => {
  const atLimit = 'é'.repeat(128); // 128 × 2 UTF-8 bytes = 256
  const overLimit = atLimit + 'é';
  const canonical = '#"' + atLimit + '"';
  const decomposed = '#"' + 'e\u0301'.repeat(128) + '"';
  for (const source of [canonical, decomposed]) {
    const out = oreslang.tokenize(source);
    assert.deepEqual(out, [{kind: 'symbol', value: source}]);
    assert.equal(out.map(t => t.value).join(''), source);
  }

  const invalid = '#"' + overLimit + '"';
  const out = oreslang.tokenize(invalid);
  assert.deepEqual(out, [{kind: 'plain', value: invalid}]);
  assert.equal(out.map(t => t.value).join(''), invalid);
});

test('invalid decoded Unicode separator stays opaque while following keyword recovers', () => {
  const bad = String.raw`#"\u2028return"`;
  const source = bad + '\r\nlet fresh = 1;';
  const out = oreslang.tokenize(source);
  assert.equal(out.map(t => t.value).join(''), source);
  assert.ok(out.some(t => t.kind === 'plain' && t.value === bad));
  assert.deepEqual(out.filter(t => t.kind === 'keyword').map(t => t.value), ['let']);
  assert.ok(!out.some(t => t.kind === 'symbol'));
});
