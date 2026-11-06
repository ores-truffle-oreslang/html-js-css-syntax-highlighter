import test from 'node:test';
import assert from 'node:assert/strict';
import {oreslang} from '../src/plugins/oreslang.js';

// Native-lexer-aligned host classification only, not compiler guest admission.
test('quoted Symbol NFC normalization admits exactly 256 UTF-8 bytes', () => {
  const accepted = [
    'é'.repeat(128),          // composed: 128 x 2 bytes
    'e\u0301'.repeat(128),    // decomposed: NFC collapses to 256 bytes
    '😀'.repeat(64),          // astral: 64 x 4 bytes
  ];
  const rejected = [
    'é'.repeat(129),
    'e\u0301'.repeat(129),
    '😀'.repeat(65),
    'safe\u202Ereturn',       // forbidden format control
    'safe\u2028return',       // forbidden Unicode line separator
  ];
  for (const name of accepted) {
    const literal = '#"' + name + '"';
    const tokens = oreslang.tokenize(literal + '\nreturn');
    assert.equal(tokens[0].value, literal);
    assert.equal(tokens[0].kind, 'symbol', 'valid NFC symbol must be admitted');
    assert.equal(tokens.map(t => t.value).join(''), literal + '\nreturn');
    assert.equal(tokens.at(-1).kind, 'keyword');
    assert.equal(tokens.at(-1).value, 'return');
  }
  for (const name of rejected) {
    const literal = '#"' + name + '"';
    const tokens = oreslang.tokenize(literal + '\nreturn');
    assert.equal(tokens[0].value, literal);
    assert.equal(tokens[0].kind, 'plain', 'invalid quoted Symbol must be opaque');
    assert.equal(tokens.map(t => t.value).join(''), literal + '\nreturn');
    assert.equal(tokens.filter(t => t.kind === 'keyword').length, 1);
    assert.equal(tokens.at(-1).value, 'return');
  }
});

test('invalid escape cannot leak embedded code-looking keyword into highlighting', () => {
  for (const value of ['#\"prefix\\q return\"', '#\"\\uD800 return\"',
    '#\"\\u0000 return\"']) {
    const source = value + '\nfnc valid() {}';
    const tokens = oreslang.tokenize(source);
    assert.equal(tokens[0].kind, 'plain');
    assert.equal(tokens[0].value, value);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.ok(tokens.some(t => t.kind === 'keyword' && t.value === 'fnc'));
    assert.ok(!tokens.some(t => t.kind === 'keyword' && t.value === 'return'));
  }
});
