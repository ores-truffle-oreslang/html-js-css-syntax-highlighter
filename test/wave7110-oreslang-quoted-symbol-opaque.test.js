import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

test('nested comments and malformed quoted Symbols cannot leak reserved keywords', () => {
  const comment = '/* outer /* nested */ return #"fake" */';
  const rejected = '#"\\u0000return"';
  const valid = '#"good"';
  const source = [comment, 'fnc ' + valid + ' ' + rejected].join('\r\n');
  const tokens = oreslang.tokenize(source);
  assert.equal(tokens.map(t => t.value).join(''), source);
  assert.ok(tokens.some(t => t.kind === 'comment' && t.value === comment));
  assert.ok(tokens.some(t => t.kind === 'keyword' && t.value === 'fnc'));
  assert.ok(tokens.some(t => t.kind === 'symbol' && t.value === valid));
  assert.ok(tokens.some(t => t.kind === 'plain' && t.value === rejected));
  assert.ok(!tokens.some(t => t.kind === 'keyword' && t.value === 'return'));
  assert.ok(!tokens.some(t => t.kind === 'symbol' && t.value === '#"fake"'));
});

test('unpaired UTF-16 even inside comments fails closed as one plain source token', () => {
  const source = '/* ignored ' + String.fromCharCode(0xd800) + ' */ fnc return';
  assert.deepEqual(oreslang.tokenize(source), [{ kind: 'plain', value: source }]);
  const restored = '/* ignored 😀 */ fnc return';
  const tokens = oreslang.tokenize(restored);
  assert.equal(tokens.map(t => t.value).join(''), restored);
  assert.ok(tokens.some(t => t.kind === 'keyword' && t.value === 'fnc'));
});
