// Mock-only transport test driver. This reads ORACLE EXPECTATIONS and must
// NEVER be used as evidence that LLVM or another compiler executed a case.
import fs from 'node:fs';
import { parseLexicalCorpus } from '../../scripts/compare-lexical-case-receipts.mjs';

const verb=process.argv.at(-1);
if(verb==='--oreslang-lexical-v1-capabilities') {
  process.stdout.write('ORESLANG_LEXICAL_V1\n');
} else if (verb==='--oreslang-lexical-v1-case') {
  const input=JSON.parse(fs.readFileSync(0,'utf8'));
  const bytes=fs.readFileSync(new URL(
    '../../contracts/editor-syntax/v1/compiler-lexical-differential-v1.tsv', import.meta.url));
  const row=parseLexicalCorpus(bytes).entries.find(x=>x.id===input.id);
  if(!row) process.exit(2);
  let hex='';
  for(let i=0;i<row.source.length;i++)
    hex+=row.source.charCodeAt(i).toString(16).padStart(4,'0');
  if(hex!==input.sourceUtf16Hex) process.exit(3);
  const answer=row.errorFragment===null
    ? {id:row.id,outcome:'TOKENS',tokenTypes:row.tokenTypes,
        symbolNameUtf16Hex:row.symbolHex==='-'?null:row.symbolHex}
    : {id:row.id,outcome:'ERROR',errorMessage:row.errorFragment};
  process.stdout.write(JSON.stringify(answer)+'\n');
} else process.exit(4);
