import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const required = ['*', '/.github/', '/src/', '/test/', '/scripts/', '/package.json', '/package-lock.json'];
const pathToPolicy = new URL('../.github/CODEOWNERS', import.meta.url);
const readPolicy = () => readFileSync(pathToPolicy, 'utf8');

function validate(text) {
  const entries = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  assert.equal(entries.length, required.length, 'no missing or extra shadowing ownership rules');
  const actual = entries.map(line => {
    const parts = line.split(/\s+/);
    assert.deepEqual(parts.slice(1), ['@ORESoftware'], 'every path requires the authorized independent owner');
    return parts[0];
  });
  assert.deepEqual(actual, required, 'last-match ownership must never override the global owner');
}

test('all highlighter source, tests, release scripts and CI have CODEOWNERS', () => {
  validate(readPolicy());
});

test('missing global owner, path shadow and replacement account fail closed', () => {
  const valid = readPolicy();
  for (const attacker of [
    valid.replace('* @ORESoftware', '# * @ORESoftware'),
    valid.replace('/src/ @ORESoftware', '/src/ @attacker'),
    valid + '\n/src/ @attacker\n',
    valid.replace('/.github/ @ORESoftware', '')
  ]) {
    assert.throws(() => validate(attacker));
  }
});
