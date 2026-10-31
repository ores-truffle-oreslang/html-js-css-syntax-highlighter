import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const corpus = JSON.parse(readFileSync(new URL('../conformance/oreslang-syntax-v1.json', import.meta.url)));
const allowed = new Set(['docs/grammar.ebnf', 'src/main/java/dev/oreslang/parser/Lexer.java']);
if (corpus.schema !== 'oreslang.editor-syntax-conformance/v1' ||
    corpus.authority.repo !== 'ores-truffle-oreslang/oreslang-source.java' ||
    !Array.isArray(corpus.authority.files) || corpus.authority.files.length !== 2 ||
    corpus.authority.files.some(x => !allowed.has(x.path) || !/^[0-9a-f]{40}$/.test(x.gitBlobSha))) {
  throw new Error('invalid pinned syntax authority');
}
if (process.argv.includes('--live')) {
  for (const entry of corpus.authority.files) {
    const url = 'https://raw.githubusercontent.com/' + corpus.authority.repo + '/main/' + entry.path;
    const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('compiler source fetch failed: ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 1024 * 1024) throw new Error('compiler source exceeds budget');
    const sha = createHash('sha1')
      .update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
    console.log(entry.path + ': pinned=' + entry.gitBlobSha + ', current=' + sha);
    if (entry.gitBlobSha !== sha) {
      console.error('Compiler grammar changed. Review and coordinate all three editor manifest copies.');
      process.exitCode = 1;
    }
  }
} else {
  console.log('Offline syntax authority validation passed; live check not requested.');
}
