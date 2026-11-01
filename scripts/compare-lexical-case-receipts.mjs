import { createHash } from 'node:crypto';

const CORPUS_SHA = 'eeed64b7d33c262b35120662386435575982a9bc';
const TYPES = /^(?:[A-Z][A-Z0-9_]*,)*[A-Z][A-Z0-9_]*$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^(?:[0-9a-f]{4})+$/;

function requireValid(condition, message) {
  if (!condition) throw new Error('LEXICAL_CASE_RECEIPT_REJECTED: ' + message);
}
function decodeUtf16(value) {
  requireValid(typeof value === 'string' && value.length > 0 &&
    value.length <= 65536 && HEX.test(value), 'unbounded or malformed UTF16 hex');
  let decoded = '';
  for (let i = 0; i < value.length; i += 4)
    decoded += String.fromCharCode(parseInt(value.slice(i, i + 4), 16));
  return decoded;
}
export function parseLexicalCorpus(bytes) {
  requireValid(Buffer.isBuffer(bytes), 'corpus must be a byte buffer');
  const gitBlob = createHash('sha1')
    .update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
  requireValid(gitBlob === CORPUS_SHA, 'immutable corpus Git blob mismatch');
  const lines = bytes.toString('utf8').split('\n');
  const seen = new Set();
  const entries = [];
  for (const row of lines) {
    if (!row || row.startsWith('#')) continue;
    const parts = row.split('\t');
    requireValid(parts.length === 5, 'corpus must contain five tab columns');
    const [id, sourceHex, tokenTypes, symbolHex, fragment] = parts;
    requireValid(ID.test(id) && !seen.has(id), 'invalid or duplicate oracle ID');
    seen.add(id);
    requireValid(sourceHex.length <= 65536, 'source exceeds input budget');
    const source = decodeUtf16(sourceHex);
    const error = tokenTypes === 'ERROR';
    requireValid(error ? symbolHex === '-' && fragment.length > 0 && fragment.length <= 256
      : TYPES.test(tokenTypes) && tokenTypes.endsWith(',EOF') && fragment === '-',
    'oracle verdict malformed: ' + id);
    if (!error && symbolHex !== '-')
      requireValid(tokenTypes.includes('SYMBOL_LITERAL'), 'Symbol is missing token type: ' + id);
    entries.push({ id, source, tokenTypes: error ? null : tokenTypes.split(','),
      symbolHex, errorFragment: error ? fragment : null });
  }
  requireValid(entries.length === 34 && seen.size === 34, 'expected 34 unique cases');
  return { gitBlob, entries };
}

/**
 * A differential comparison is NOT an authentication of a compiler or a
 * GitHub Actions job. The result intentionally has no PASS status.
 * The caller must verify real compiler provenance and executed job logs.
 */
export function compareUntrustedLexicalReceipt(corpusBytes, receipt) {
  const { gitBlob, entries } = parseLexicalCorpus(corpusBytes);
  requireValid(receipt && typeof receipt === 'object' && !Array.isArray(receipt) &&
    receipt.schema === 'oreslang-lexical-case-receipt-v1',
  'unsupported receipt schema');
  requireValid(['java','llvm','wasm','net','forge'].includes(receipt.backend),
    'unknown backend');
  requireValid(receipt.corpusBlobSha === gitBlob, 'receipt corpus mismatch');
  requireValid(receipt.tokenModel === 'java-lexical-token-types-v1',
    'token translation model must be declared');
  requireValid(Array.isArray(receipt.cases) && receipt.cases.length === entries.length,
    'missing or extra case receipts');
  const byId = new Map();
  for (const caseResult of receipt.cases) {
    requireValid(caseResult && typeof caseResult === 'object' &&
      !Array.isArray(caseResult) && ID.test(caseResult.id) &&
      !byId.has(caseResult.id), 'duplicate/malformed case result');
    requireValid(caseResult.outcome === 'TOKENS' || caseResult.outcome === 'ERROR',
      'unrecognized case outcome');
    if (caseResult.outcome === 'TOKENS') {
      requireValid(Array.isArray(caseResult.tokenTypes) &&
        caseResult.tokenTypes.length > 0 && caseResult.tokenTypes.length <= 1024 &&
        caseResult.tokenTypes.every(t => /^[A-Z][A-Z0-9_]*$/.test(t)),
        'unbounded or malformed token sequence');
      requireValid(caseResult.symbolNameUtf16Hex === null ||
        (typeof caseResult.symbolNameUtf16Hex === 'string' &&
          caseResult.symbolNameUtf16Hex.length <= 65536 &&
          HEX.test(caseResult.symbolNameUtf16Hex)),
        'malformed or missing Symbol name field');
      requireValid(!Object.hasOwn(caseResult, 'errorMessage'), 'tokens cannot carry error');
    } else {
      requireValid(typeof caseResult.errorMessage === 'string' &&
        caseResult.errorMessage.length > 0 && caseResult.errorMessage.length <= 1024,
        'error message absent or unbounded');
      requireValid(!Object.hasOwn(caseResult, 'tokenTypes') &&
        !Object.hasOwn(caseResult, 'symbolNameUtf16Hex'), 'error cannot carry tokens');
    }
    byId.set(caseResult.id, caseResult);
  }
  const mismatches = [];
  for (const expected of entries) {
    const actual = byId.get(expected.id);
    requireValid(actual, 'missing case ID: ' + expected.id);
    if (expected.errorFragment !== null) {
      if (actual.outcome !== 'ERROR' ||
          !actual.errorMessage.includes(expected.errorFragment))
        mismatches.push({id:expected.id,reason:'wrong error classification or diagnostic'});
    } else if (actual.outcome !== 'TOKENS' ||
        JSON.stringify(actual.tokenTypes) !== JSON.stringify(expected.tokenTypes) ||
        actual.symbolNameUtf16Hex !==
          (expected.symbolHex === '-' ? null : expected.symbolHex)) {
      mismatches.push({id:expected.id,reason:'wrong tokens or normalized Symbol'});
    }
  }
  return {verification:'UNTRUSTED_COMPARISON_ONLY',
    backend:receipt.backend, corpusBlobSha:gitBlob,
    checkedCases:entries.length, matchedCases:entries.length - mismatches.length,
    mismatches};
}
