import { spawnSync } from 'node:child_process';
import { parseLexicalCorpus, compareUntrustedLexicalReceipt } from './compare-lexical-case-receipts.mjs';

const MAX_OUTPUT = 128 * 1024;
const MAX_TIMEOUT_MS = 2500;
function subprocess(command, args, input, timeoutMs) {
  return spawnSync(command, args, {
    input,
    encoding: 'utf8',
    shell: false,
    timeout: timeoutMs,
    maxBuffer: MAX_OUTPUT,
    windowsHide: true,
    env: { PATH: process.env.PATH || '', LANG: 'C', LC_ALL: 'C' }
  });
}

/**
 * Adapter transport for the native LLVM compiler's future lexical-v1 CLI.
 *
 * Today llvmc's production Lexer is an internal Parser.cpp implementation
 * with no lexical JSON CLI. It cannot truthfully execute this protocol yet.
 * Do not call compilation/IR success a lexer case PASS.
 *
 * The driver must implement:
 *  argv: --oreslang-lexical-v1-capabilities => stdout ORESLANG_LEXICAL_V1
 *  argv: --oreslang-lexical-v1-case, stdin JSON {id,sourceUtf16Hex}
 *  stdout: exactly one JSON case record, schema defined by comparator.
 *
 * Outputs are untrusted until independently checked against real compiler
 * revision / job logs. No shell, network, source export or credential forwarding.
 */
export function probeLlvmLexicalDriver({ command, args = [], corpusBytes, timeoutMs = 1500 }) {
  const corpus = parseLexicalCorpus(corpusBytes);
  if (typeof command !== 'string' || command.length === 0 ||
      !Array.isArray(args) || args.length > 8 ||
      !args.every(arg => typeof arg === 'string' && arg.length <= 1024) ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > MAX_TIMEOUT_MS)
    throw new Error('LLVM_LEXICAL_ADAPTER_REJECTED: bad executable arguments or timeout');
  const check = subprocess(command, [...args, '--oreslang-lexical-v1-capabilities'], '', timeoutMs);
  if (check.error || check.status !== 0 || check.stdout.trim() !== 'ORESLANG_LEXICAL_V1')
    return {status:'INTERFACE_UNAVAILABLE', verified:false, executedCases:0,
      reason:'production LLVM lexer does not expose the lexical-v1 JSON probe (or probe failed)'};
  const cases = [];
  for (const row of corpus.entries) {
    // Iterate UTF-16 units, never code points, to preserve unpaired surrogates.
    let sourceUtf16Hex = '';
    for (let i = 0; i < row.source.length; i++)
      sourceUtf16Hex += row.source.charCodeAt(i).toString(16).padStart(4,'0');
    const input = JSON.stringify({id:row.id,sourceUtf16Hex}) + '\n';
    const result = subprocess(command,[...args,'--oreslang-lexical-v1-case'],input,timeoutMs);
    if (result.error || result.status !== 0 || result.stdout.length > MAX_OUTPUT) {
      return {status:'DRIVER_FAILED',verified:false,executedCases:cases.length,
        failedCaseId:row.id,reason:'native lexical probe failed or timed out'};
    }
    let value;
    try { value = JSON.parse(result.stdout); } catch {
      return {status:'DRIVER_FAILED',verified:false,executedCases:cases.length,
        failedCaseId:row.id,reason:'native probe emitted malformed JSON'};
    }
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.id !== row.id) {
      return {status:'DRIVER_FAILED',verified:false,executedCases:cases.length,
        failedCaseId:row.id,reason:'native probe emitted incorrect case ID'};
    }
    cases.push(value);
  }
  const comparison = compareUntrustedLexicalReceipt(corpusBytes,{
    schema:'oreslang-lexical-case-receipt-v1',backend:'llvm',corpusBlobSha:corpus.gitBlob,
    tokenModel:'java-lexical-token-types-v1',cases
  });
  return {status:'UNVERIFIED_CASE_COMPARISON',verified:false,executedCases:cases.length,
    comparison,reason:'compare exact-head compiler and job logs before promoting a backend status'};
}
