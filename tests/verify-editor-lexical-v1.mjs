import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(fs.readFileSync(path.join(here,'../contracts/editor-syntax/v1/editor-lexical-contract.json'),'utf8'));

test('editor lexical snapshot uses pinned immutable compiler source blobs', () => {
  assert.equal(contract.version,1);
  assert.equal(contract.kind,'oreslang-editor-lexical-contract');
  for (const key of ['lexerBlobSha','tokenBlobSha','grammarBlobSha']) {
    assert.match(contract.compilerSnapshot[key],/^[0-9a-f]{40}$/);
  }
  assert.match(contract.status,/NOT parser or backend acceptance/);
  assert.equal(contract.reservedWords.length,93);
  assert.deepEqual(contract.reservedWords,[...new Set(contract.reservedWords)].sort());
});
test('reserved keyword and operator classes preserve current lexer behavior', () => {
  for (const word of ['eq','neq','is','isoactor','null','panic','cpu','gpu','nb','select']) {
    assert.ok(contract.reservedWords.includes(word),word);
  }
  for (const word of contract.runtimeControlWords.concat(contract.comparisonOperatorWords)) {
    assert.ok(contract.reservedWords.includes(word),word);
  }
  assert.deepEqual(contract.operatorTokenCharacters,['%','^']);
  assert.deepEqual(contract.splitLexerCompoundWords,['nb-select']);
});
test('fixtures use unambiguous token spans and evidence labels', () => {
  const ids = new Set();
  for(const fixture of contract.fixtures) {
    assert.ok(!ids.has(fixture.id),fixture.id);
    ids.add(fixture.id);
    assert.ok(typeof fixture.source==='string' && fixture.source);
    assert.match(fixture.evidence,/^(lexer-|compiler-|editor-preview-only)/);
    for (const t of fixture.expected) {
      assert.ok(['keyword','operator','symbol','runtimeGlobal','plain'].includes(t.kind));
      assert.ok(fixture.source.includes(t.value),fixture.id+': '+t.value);
    }
    for (const t of fixture.forbidden||[]) {
      assert.ok(fixture.source.includes(t.value),fixture.id+': '+t.value);
    }
  }
  assert.ok(ids.has('opaque-comments-strings'));
  assert.ok(ids.has('hash-symbols'));
});
