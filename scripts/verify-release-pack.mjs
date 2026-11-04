import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
const allowed=new Set([
  'package/package.json','package/README.md','package/LICENSE',
  ...pkg.files.map(name=>'package/'+name)
]);
const temp=mkdtempSync(join(tmpdir(),'oreslang-package-smoke-'));
function pack(dest){
  mkdirSync(dest);
  const output=execFileSync('npm',['pack','--json','--ignore-scripts','--pack-destination',dest],
    {encoding:'utf8',cwd:new URL('..',import.meta.url)});
  const items=JSON.parse(output);
  assert.equal(items.length,1);
  const entry=items[0];
  assert.deepEqual(entry.files.map(f=>f.path).sort(),
    Array.from(allowed).map(x=>x.slice('package/'.length)).sort(),
    'published files must be an exact source allowlist, excluding unregistered target preview and tests');
  const path=join(dest,entry.filename);
  const content=readFileSync(path);
  return {path,sha:createHash('sha256').update(content).digest('hex'),filename:entry.filename};
}
try{
  const first=pack(join(temp,'a'));
  const second=pack(join(temp,'b'));
  assert.equal(first.sha,second.sha,'two clean package archives must be byte-identical');
  const extracted=join(temp,'extracted');
  mkdirSync(extracted);
  execFileSync('tar',['-xzf',first.path,'-C',extracted]);
  const unpacked=join(extracted,'package');
  const entry=await import(pathToFileURL(join(unpacked,'src/index.js')).href);
  const plugin=await import(pathToFileURL(join(unpacked,'src/plugins/oreslang.js')).href);
  const astro=await import(pathToFileURL(join(unpacked,'src/adapters/astro.js')).href);
  assert.equal(typeof entry.highlight,'function');
  assert.equal(typeof entry.defaultHighlighter.tokenize,'function');
  assert.equal(typeof plugin.oreslang.tokenize,'function');
  assert.ok(astro,'Astro adapter import must resolve from packaged archive');
  const code='pub fnc hello() { return "<script>"; }';
  const tokens=entry.defaultHighlighter.tokenize(code,'oreslang');
  assert.ok(tokens.some(x=>x.kind==='keyword'&&x.value==='pub'));
  const html=entry.highlight('<script> & "','oreslang');
  assert.ok(!html.includes('<script>'),'published highlighter must escape unsafe HTML');
  assert.ok(!html.includes(' & "'),'raw unescaped input must not reach output');
  const m=JSON.parse(readFileSync(join(unpacked,'package.json')));
  assert.ok(!JSON.stringify(m.exports).includes('target-preview'));
  assert.equal(m.exports['.'].import,'./src/index.js');
  console.log('PASS npm package allowlist, exact SHA256 double-pack, unpacked entrypoints, lexical smoke, HTML safety');
  console.log('SHA256 '+first.sha+' '+first.filename);
}finally{rmSync(temp,{recursive:true,force:true});}
