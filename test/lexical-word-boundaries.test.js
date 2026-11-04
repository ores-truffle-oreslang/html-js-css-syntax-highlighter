import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defaultHighlighter } from '../src/index.js';

const contract = JSON.parse(fs.readFileSync(
  new URL('../contracts/editor-syntax/v1/editor-lexical-contract.json', import.meta.url), 'utf8'));
const tokenize = input => defaultHighlighter.tokenize(input, 'oreslang');

test('all 93 reserved words remain plain inside longer ASCII identifiers', () => {
  assert.equal(contract.reservedWords.length, 93);
  for (const word of contract.reservedWords) {
    for (const source of [word + 'x', '_' + word, word + '_suffix']) {
      const tokens = tokenize(source);
      assert.equal(tokens.map(t => t.value).join(''), source);
      assert.ok(!tokens.some(t => t.kind === 'keyword' ||
        t.kind === 'runtimeGlobal' || t.kind === 'operator'), source);
    }
  }
});

test('quoted Symbol escaped surrogate pairs are valid, isolated half-pairs are not', () => {
  for (const source of ['#"\\uD83D\\uDE00"', "#'\\uD83D\\uDE00'"]) {
    const tokens = tokenize(source);
    assert.deepEqual(tokens.filter(t => t.kind === 'symbol').map(t => t.value),
      [source], source);
  }
  for (const source of ['#"\\uD83D"', '#"\\uDE00"', '#"\\uDE00\\uD83D"',
    '#"\\uD83D\\u0061"']) {
    const tokens = tokenize(source);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.ok(!tokens.some(t => t.kind === 'symbol'), source);
  }
});
