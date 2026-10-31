import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateAdmission } from '../scripts/validate-backend-lexical-admission.mjs';

const load = () => JSON.parse(fs.readFileSync(
  new URL('../contracts/editor-syntax/v1/backend-lexical-admission-v1.json', import.meta.url)));
const corpus = fs.readFileSync(new URL(
  '../contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv', import.meta.url));

test('five-backend matrix validates the exact Git blob but claims no execution', () => {
  const matrix = load();
  assert.deepEqual(validateAdmission(matrix, corpus), {
    checkedBackends: 5,
    expectedCases: 34,
    actualCorpusBlob: 'eeed64b7d33c262b35120662386435575982a9bc'
  });
  for (const entry of matrix.backends) {
    for (const stage of ['lexer', 'parser', 'runtime']) {
      assert.equal(entry[stage], 'NOT_EXECUTED', entry.id + ': ' + stage);
    }
  }
});

test('deny green, skipped, or ambiguous backend outcomes without real receipts', () => {
  for (const bogus of ['PASS', 'FAIL', 'pending', 'skipped', 'success']) {
    const matrix = load();
    matrix.backends[0].lexer = bogus;
    assert.throws(() => validateAdmission(matrix, corpus), /LEXICAL_ADMISSION_REJECTED/);
  }
  const forged = load();
  forged.backends[2].testedHead = 'a'.repeat(40);
  assert.throws(() => validateAdmission(forged, corpus), /fabricated receipt/);
});

test('reject missing backends, invalid corpus content, and unsupported without explanation', () => {
  const missing = load();
  missing.backends.pop();
  assert.throws(() => validateAdmission(missing, corpus), /backend identities/);
  const altered = Buffer.from(corpus);
  altered[altered.length-2] ^= 1;
  assert.throws(() => validateAdmission(load(), altered), /blob mismatch/);
  const unsupported = load();
  unsupported.backends[3].lexer = 'UNSUPPORTED';
  assert.throws(() => validateAdmission(unsupported, corpus), /explicit reason/);
  unsupported.backends[3].unsupportedReason = 'No checked native lexer execution or supported frontend found';
  assert.equal(validateAdmission(unsupported, corpus).checkedBackends, 5);
});
