import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { probeLlvmLexicalDriver } from '../scripts/llvm-lexical-probe-adapter.mjs';

const bytes=fs.readFileSync(new URL(
  '../contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv', import.meta.url));
const syntheticDriver=fileURLToPath(new URL(
  '../tools/fixtures/mock-llvm-lexical-driver.mjs', import.meta.url));

test('a real LLVM compiler lacking token-dump protocol cannot be marked passing', () => {
  const result=probeLlvmLexicalDriver({command:process.execPath,corpusBytes:bytes});
  assert.equal(result.status,'INTERFACE_UNAVAILABLE');
  assert.equal(result.verified,false);
  assert.equal(result.executedCases,0);
  assert.equal(Object.hasOwn(result,'comparison'),false);
});

test('a synthetic transport driver executes exactly 34 protocol cases, never attests LLVM', () => {
  const result=probeLlvmLexicalDriver({
    command:process.execPath,args:[syntheticDriver],corpusBytes:bytes
  });
  assert.equal(result.status,'UNVERIFIED_CASE_COMPARISON');
  assert.equal(result.verified,false);
  assert.equal(result.executedCases,34);
  assert.equal(result.comparison.verification,'UNTRUSTED_COMPARISON_ONLY');
  assert.equal(result.comparison.matchedCases,34);
  assert.deepEqual(result.comparison.mismatches,[]);
});

test('missing driver or unbounded process settings fail closed', () => {
  const missing=probeLlvmLexicalDriver({
    command:'/does-not-exist-oreslang-llvmc',corpusBytes:bytes
  });
  assert.equal(missing.status,'INTERFACE_UNAVAILABLE');
  for(const bad of [
    {command:'',corpusBytes:bytes}, {command:process.execPath,corpusBytes:bytes,timeoutMs:10000},
    {command:process.execPath,args:[42],corpusBytes:bytes}
  ]) assert.throws(()=>probeLlvmLexicalDriver(bad),/LLVM_LEXICAL_ADAPTER_REJECTED/);
});
