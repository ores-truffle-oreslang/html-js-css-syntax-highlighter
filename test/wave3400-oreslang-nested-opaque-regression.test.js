// Built-in Oreslang lexer host regression; not compiler guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { oreslang } from '../src/plugins/oreslang.js';

test('nested block comments hide tokens until their matching final delimiter', () => {
  const code = 'pub /* outer /* inner pub fnc */ return actor */ fnc sample() { return; }';
  const tokens = oreslang.tokenize(code);
  assert.equal(tokens.map(token => token.value).join(''), code);
  const comments = tokens.filter(token => token.kind === 'comment');
  assert.equal(comments.length, 1);
  assert.equal(comments[0].value, '/* outer /* inner pub fnc */ return actor */');
  assert.equal(tokens.filter(token => token.kind === 'keyword' && token.value === 'fnc').length, 1);
  assert.equal(tokens.filter(token => token.kind === 'keyword' && token.value === 'return').length, 1);
  assert.deepEqual(oreslang.tokenize(code), tokens);
});

test('invalid quoted Symbols cannot leak keyword highlighting into later valid code', () => {
  const code = String.raw`let x = #"alpha\u0041"; let y = #'bad\q return'; fnc valid() { return; }`;
  const tokens = oreslang.tokenize(code);
  assert.equal(tokens.map(token => token.value).join(''), code);
  assert.ok(tokens.some(token => token.kind === 'symbol' && token.value === String.raw`#"alpha\u0041"`));
  assert.ok(tokens.some(token => token.kind === 'plain' && token.value === String.raw`#'bad\q return'`));
  assert.equal(tokens.filter(token => token.kind === 'keyword' && token.value === 'return').length, 1);
  assert.deepEqual(oreslang.tokenize(code), tokens);
});
