import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseLexicalCorpus, compareUntrustedLexicalReceipt } from '../scripts/compare-lexical-case-receipts.mjs';

const corpus = fs.readFileSync(new URL(
  '../contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv', import.meta.url));
const cases = parseLexicalCorpus(corpus);
const synthetic = () => ({
  schema:'oreslang-lexical-case-receipt-v1', backend:'llvm',
  corpusBlobSha:cases.gitBlob, tokenModel:'java-lexical-token-types-v1',
  // These fixtures are generated entirely from expected values; never
  // represent this as native LLVM compiler output!
  cases:cases.entries.map(row => row.errorFragment === null ?
    {id:row.id,outcome:'TOKENS',tokenTypes:[...row.tokenTypes],
      symbolNameUtf16Hex:row.symbolHex === '-' ? null : row.symbolHex} :
    {id:row.id,outcome:'ERROR',errorMessage:row.errorFragment})
});

test('offline synthetic fixture comparison is explicitly untrusted', () => {
  const result=compareUntrustedLexicalReceipt(corpus,synthetic());
  assert.equal(result.verification,'UNTRUSTED_COMPARISON_ONLY');
  assert.equal(result.checkedCases,34);
  assert.equal(result.matchedCases,34);
  assert.deepEqual(result.mismatches,[]);
});

test('wrong token, normalized Symbol, error, and actual success are detectable', () => {
  const result=synthetic();
  result.cases.find(x=>x.id==='kw-comparisons').tokenTypes=['IDENT','IDENT','IDENT','EOF'];
  result.cases.find(x=>x.id==='symbol-nfc').symbolNameUtf16Hex='0065';
  result.cases.find(x=>x.id==='bad-symbol-high').outcome='TOKENS';
  const high=result.cases.find(x=>x.id==='bad-symbol-high');
  delete high.errorMessage;
  high.tokenTypes=['SYMBOL_LITERAL','EOF'];
  high.symbolNameUtf16Hex=null;
  result.cases.find(x=>x.id==='bad-symbol-low').errorMessage='generic error';
  const compared=compareUntrustedLexicalReceipt(corpus,result);
  assert.equal(compared.matchedCases,30);
  assert.deepEqual(compared.mismatches.map(x=>x.id),[
    'kw-comparisons','symbol-nfc','bad-symbol-high','bad-symbol-low'
  ]);
});

test('a valid token case cannot smuggle an extra unexpected Symbol payload', () => {
  const report=synthetic();
  report.cases.find(x=>x.id==='kw-return').symbolNameUtf16Hex='0061';
  const result=compareUntrustedLexicalReceipt(corpus,report);
  assert.equal(result.matchedCases,33);
  assert.deepEqual(result.mismatches.map(x=>x.id),['kw-return']);
});

test('reject forged schema, wrong SHA, missing cases, duplicates and ambiguity', () => {
  for(const mutation of [
    r=>{r.schema='other';},
    r=>{r.corpusBlobSha='a'.repeat(40);},
    r=>{r.tokenModel='native-undocumented';},
    r=>{r.backend='other';},
    r=>{r.cases.pop();},
    r=>{r.cases[0].id=r.cases[1].id;},
    r=>{r.cases[0].outcome='SKIPPED';},
    r=>{r.cases[0].tokenTypes=['RETURN'];r.cases[0].errorMessage='mixed';},
    r=>{r.cases.find(x=>x.outcome==='ERROR').errorMessage='';}
  ]){
    const receipt=synthetic();
    mutation(receipt);
    assert.throws(()=>compareUntrustedLexicalReceipt(corpus,receipt),
      /LEXICAL_CASE_RECEIPT_REJECTED/);
  }
});

test('reject an altered or missing corpus even if a receipt looks complete', () => {
  const mutated=Buffer.from(corpus);
  mutated[100]^=1;
  assert.throws(()=>parseLexicalCorpus(mutated),/corpus Git blob mismatch/);
  assert.throws(()=>compareUntrustedLexicalReceipt(mutated,synthetic()),
    /corpus Git blob mismatch/);
});
