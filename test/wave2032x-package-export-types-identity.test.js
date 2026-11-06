// Public package export/type identity regression; source-owned host-only test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fs.realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function verifiedExportFile(raw, description) {
  assert.equal(typeof raw, 'string', description);
  assert.match(raw, /^\.\/src\/[a-zA-Z0-9_./-]+\.(?:js|d\.ts)$/,
    description + ': only canonical own-source paths');
  const relative = raw.slice(2);
  assert.equal(path.posix.normalize(relative), relative,
    description + ': no parent aliases or redundant segments');
  assert.ok(!relative.split('/').includes('..'), description + ': no traversal');
  assert.ok(manifest.files.includes(relative),
    description + ': publicly exported file must appear in package whitelist');
  const absolute = path.join(root, relative);
  assert.ok(fs.lstatSync(absolute).isFile(), description + ': ordinary file required');
  assert.ok(!fs.lstatSync(absolute).isSymbolicLink(),
    description + ': no external linked source authority');
  const resolved = fs.realpathSync(absolute);
  assert.ok(resolved.startsWith(root + path.sep),
    description + ': resolved file must stay inside package');
  assert.ok(fs.statSync(absolute).size > 0, description + ': nonempty reviewed source');
  return absolute;
}

test('all public ESM entrypoints are local, included and paired with declarations', async () => {
  assert.equal(manifest.type, 'module');
  assert.ok(manifest.exports && typeof manifest.exports === 'object');
  const expected = new Map([
    ['.', ['SyntaxHighlighter', 'createRegexLanguage', 'highlight', 'defaultHighlighter']],
    ['./plugins/oreslang', ['oreslang']],
    ['./adapters/astro', ['highlightForAstro', 'astroCodeProps']],
  ]);
  for (const [publicName, symbols] of expected) {
    assert.ok(Object.hasOwn(manifest.exports, publicName), publicName);
    const entry = manifest.exports[publicName];
    assert.equal(Object.getPrototypeOf(entry), Object.prototype);
    const runtime = verifiedExportFile(entry.import, publicName + ' runtime');
    verifiedExportFile(entry.types, publicName + ' types');
    const imported = await import(pathToFileURL(runtime).href);
    for (const symbol of symbols) {
      assert.ok(Object.hasOwn(imported, symbol), publicName + ':' + symbol);
    }
  }
  for (const [publicName, entry] of Object.entries(manifest.exports)) {
    assert.ok(entry && typeof entry === 'object', publicName);
    verifiedExportFile(entry.import, publicName + ' runtime');
    verifiedExportFile(entry.types, publicName + ' types');
  }
});

test('packaged runtime and types are never the same artifact', () => {
  for (const [publicName, entry] of Object.entries(manifest.exports)) {
    const runtime = verifiedExportFile(entry.import, publicName + ' runtime');
    const types = verifiedExportFile(entry.types, publicName + ' types');
    assert.notEqual(runtime, types, publicName + ': type and runtime paths must differ');
    assert.match(fs.readFileSync(types, 'utf8'), /\b(?:export|declare)\b/,
      publicName + ': declaration should contain a public binding');
  }
});
