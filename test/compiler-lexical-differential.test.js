import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defaultHighlighter } from '../src/index.js';

const corpus = fs.readFileSync(new URL(
  '../contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv', import.meta.url
), 'utf8');
const fromHex = hex => {
  assert.match(hex, /^(?:[0-9a-f]{4})+$/);
  assert.ok(hex.length <= 65536, 'limit fixture source to 16K UTF-16 units');
  let result = '';
  for (let i = 0; i < hex.length; i += 4) {
    result += String.fromCharCode(parseInt(hex.slice(i, i+4), 16));
  }
  return result;
};
const rows = corpus.trimEnd().split('\n')
  .filter(line => line && !line.startsWith('#'))
  .map(line => {
    const fields = line.split('\t');
    assert.equal(fields.length, 5, 'differential record must have 5 columns');
    const [id, hex, expected, symbolHex, error] = fields;
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(expected, /^(?:ERROR|[A-Z_]+(?:,[A-Z_]+)*)$/);
    if (expected === 'ERROR') {
      assert.equal(symbolHex, '-', id);
      assert.notEqual(error, '-', id);
    } else {
      assert.equal(error, '-', id);
      assert.ok(expected.endsWith(',EOF'), id);
      if (symbolHex !== '-') assert.ok(expected.includes('SYMBOL_LITERAL'), id);
    }
    return { id, source: fromHex(hex), expected, symbolName: symbolHex === '-' ? null : fromHex(symbolHex), error };
  });

test('34 distinct compiler-lexical oracle cases with strict, bounded records', () => {
  assert.equal(rows.length, 34);
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  assert.equal(rows.filter(row => row.expected === 'ERROR').length, 11);
  assert.equal(rows.filter(row => row.expected !== 'ERROR').length, 23);
  assert.ok(rows.some(row => row.id === 'bad-unpaired-in-comment'));
  assert.ok(rows.some(row => row.id === 'symbol-nfc'));
});

test('editor tokenizer preserves every synthetic Java oracle input byte-for-code-unit', () => {
  for (const row of rows) {
    const tokens = defaultHighlighter.tokenize(row.source, 'oreslang');
    assert.equal(tokens.map(t => t.value).join(''), row.source, row.id);
  }
});

test('editor highlights standalone valid Symbols but does not admit malformed escaped surrogates', () => {
  for (const row of rows) {
    const tokens = defaultHighlighter.tokenize(row.source, 'oreslang');
    const symbols = tokens.filter(t => t.kind === 'symbol');
    if (row.id.startsWith('symbol-')) {
      assert.deepEqual(symbols.map(t => t.value), [row.source], row.id);
    }
    if (row.id.startsWith('bad-symbol-')) {
      assert.equal(symbols.length, 0, row.id);
    }
  }
});

test('host-invalid UTF-16 and NUL source never receive editor keyword or Symbol scopes', () => {
  for (const id of ['bad-nul-in-comment', 'bad-unpaired-in-comment']) {
    const row = rows.find(x => x.id === id);
    assert.deepEqual(defaultHighlighter.tokenize(row.source, 'oreslang'),
      [{kind: 'plain', value: row.source}]);
  }
});
