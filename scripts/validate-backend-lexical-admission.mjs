import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const EXACT_BACKENDS = ['java', 'llvm', 'wasm', 'net', 'forge'];
const DIMENSIONS = ['lexer', 'parser', 'runtime'];
const statuses = new Set(['NOT_EXECUTED', 'PASS', 'FAIL', 'UNSUPPORTED']);
const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

export function validateAdmission(report, corpusBytes) {
  const reject = message => { throw new Error('LEXICAL_ADMISSION_REJECTED: ' + message); };
  if (!report || typeof report !== 'object' || Array.isArray(report) ||
      report.schema !== 'oreslang-lexical-backend-admission-v1' ||
      report.status !== 'test-plan-not-backend-execution-evidence' ||
      report.corpusPath !== 'contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv' ||
      report.expectedCases !== 34) reject('invalid schema or corpus descriptor');
  if (!Buffer.isBuffer(corpusBytes)) reject('corpus bytes required');
  const actualBlob = createHash('sha1')
    .update(Buffer.from('blob ' + corpusBytes.length + '\0')).update(corpusBytes).digest('hex');
  if (actualBlob !== report.corpusBlobSha ||
      actualBlob !== 'eeed64b7d33c262b35120662386435575982a9bc')
    reject('exact corpus Git blob mismatch');
  if (JSON.stringify(report.dimensions) !== JSON.stringify(DIMENSIONS))
    reject('incomplete evidence dimensions');
  if (!Array.isArray(report.backends) || report.backends.length !== EXACT_BACKENDS.length ||
      JSON.stringify(report.backends.map(b => b.id)) !== JSON.stringify(EXACT_BACKENDS))
    reject('missing, duplicate or reordered backend identities');

  for (const backend of report.backends) {
    if (!backend || typeof backend !== 'object' || Array.isArray(backend))
      reject('malformed backend record');
    for (const dimension of DIMENSIONS) {
      if (!statuses.has(backend[dimension])) reject(backend.id + ' invalid ' + dimension);
    }
    const claimsExecution = DIMENSIONS.some(d => backend[d] === 'PASS' || backend[d] === 'FAIL');
    const hasUnsupported = DIMENSIONS.some(d => backend[d] === 'UNSUPPORTED');
    // This file is explicitly a test PLAN, not a signed/verified execution
    // registry. Even plausible GitHub run URLs and SHA-shaped metadata can be
    // forged. A PASS/FAIL claim must graduate to a separately verified,
    // independently authenticated execution-evidence schema.
    if (claimsExecution)
      reject(backend.id + ' test-plan cannot claim executed PASS/FAIL evidence');
    if (backend.testedHead !== null || backend.runUrl !== null ||
        backend.executedSteps !== 0 || backend.executedCases !== 0 ||
        backend.receiptSha256 !== null)
      reject(backend.id + ' nonexecuted backend carries fabricated receipt fields');
    if (hasUnsupported && !(typeof backend.unsupportedReason === 'string' &&
         backend.unsupportedReason.length >= 12))
      reject(backend.id + ' unsupported state needs an explicit reason');
    if (!hasUnsupported && Object.hasOwn(backend, 'unsupportedReason'))
      reject(backend.id + ' stale unsupported reason');
  }
  return { checkedBackends: EXACT_BACKENDS.length, expectedCases: report.expectedCases,
    actualCorpusBlob: actualBlob };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw new Error('usage: node validate-backend-lexical-admission.mjs REPORT CORPUS');
    const result = validateAdmission(
      JSON.parse(fs.readFileSync(process.argv[2], 'utf8')),
      fs.readFileSync(process.argv[3]));
    process.stdout.write('LEXICAL_ADMISSION_SCHEMA_VALID ' + JSON.stringify(result) + '\n');
  } catch (error) {
    process.stderr.write(String(error.message) + '\n');
    process.exitCode = 1;
  }
}
